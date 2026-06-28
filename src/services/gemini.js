import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey });

export async function analyzeMistakeImage(base64Image, colorRules = []) {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Please set EXPO_PUBLIC_GEMINI_API_KEY in .env file.');
  }

  const rulesText = colorRules.length > 0 
    ? `\n特別筆跡規則：\n${colorRules.map(r => `- 如果科目是 ${r.subject} 且看到 ${r.color} 筆跡，則代表：${r.action}`).join('\n')}` 
    : '';

  // Pass 1: 初步解析
  const pass1Prompt = `
您是一位頂尖的家教，正在解析學生的錯題。
請閱讀圖片中的題目，辨識科目、擷取完整題目內容，並提供解答。
強制規定：請務必使用「繁體中文 (Traditional Chinese)」回覆所有內容。

嚴格指令：
1. 針對形音義、簡單單字等基礎題型，不要給多餘解釋，直接給答案。
2. 解答必須簡潔清晰。${rulesText}

請「僅」回傳一個 JSON 格式，包含以下欄位：
{
  "subject": "科目名稱 (例如：國文, 數學, 英文)",
  "question": "完整題目內容",
  "solution": "簡潔的解答與步驟"
}
`;

  try {
    const interaction1 = await client.interactions.create({
      model: "gemini-3.5-flash",
      input: [
        { type: "text", text: pass1Prompt },
        {
          type: "image",
          data: base64Image,
          mime_type: "image/jpeg"
        }
      ],
      response_format: { type: "text", mime_type: "application/json" }
    });

    const pass1Result = interaction1.output_text;

    // Pass 2: 嚴格雙重查證
    const pass2Prompt = `
以下是我剛剛初步萃取與解答的結果，請您扮演「嚴格審查員」再次檢查圖片與這份初步結果。
請揪出：文字是否誤判 (特別是 OCR 容易錯的字)、解題邏輯是否有錯、計算是否正確。

初步結果：
${pass1Result}

請修正所有錯誤，並「僅」回傳修正後的完美 JSON 格式，欄位保持相同，所有內容強制使用「繁體中文」：
{
  "subject": "科目",
  "question": "修正後的題目",
  "solution": "修正後的正確解答"
}
`;

    const interaction2 = await client.interactions.create({
      model: "gemini-3.5-flash",
      input: [
        { type: "text", text: pass2Prompt },
        {
          type: "image",
          data: base64Image,
          mime_type: "image/jpeg"
        }
      ],
      response_format: { type: "text", mime_type: "application/json" }
    });

    return JSON.parse(interaction2.output_text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function chatWithAI(mistake, messages, onUpdateSolution) {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Please set EXPO_PUBLIC_GEMINI_API_KEY in .env file.');
  }

  const systemInstruction = `您是一位耐心的家教，正在幫助學生檢討錯題。
科目：${mistake.subject}
原始題目：${mistake.question}
目前的解答：${mistake.solution}

如果學生點出解答有錯誤、或是您發現有更棒的解法，請務必呼叫 "update_solution" 工具來把最新的正確解答更新到資料庫中。
請務必使用繁體中文回覆。`;

  const inputMessages = messages.filter(m => m.id !== '1').map(m => ({
    type: "text", 
    text: m.text, 
    // In Interactions API we pass history differently if we need to, but for simplicity we can construct a flat input array of alternating roles, or just pass the full history string.
    // Given standard interactions API, we can format it as chat history string:
    role: m.role
  }));

  const chatHistoryText = inputMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

  try {
    const interaction = await client.interactions.create({
      model: "gemini-3.5-flash",
      config: {
        system_instruction: { parts: [{ text: systemInstruction }] },
        tools: [{
          function_declarations: [{
            name: "update_solution",
            description: "Updates the official solution for the mistake in the database.",
            parameters: {
              type: "OBJECT",
              properties: {
                new_solution: { type: "STRING", description: "The new corrected solution." }
              },
              required: ["new_solution"]
            }
          }]
        }]
      },
      input: [
        { type: "text", text: "Chat History:\n" + chatHistoryText + "\nPlease respond to the user's last message." }
      ]
    });

    // Check if tool was called
    if (interaction.function_calls && interaction.function_calls.length > 0) {
      const call = interaction.function_calls[0];
      if (call.name === 'update_solution') {
        const newSolution = call.args.new_solution;
        await onUpdateSolution(newSolution);
        return `I have updated the official solution. Here is the new solution: \n${newSolution}`;
      }
    }

    return interaction.output_text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
}
