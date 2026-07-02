import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';

const getFormattedDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
};

export const exportToPDF = async (mistakes, includeSolution = false, fontSize = 16) => {
  try {
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .mistake { margin-bottom: 120px; page-break-inside: avoid; }
            .question { font-size: ${fontSize}px; margin-bottom: 20px; line-height: 1.8; }
            .solution { background: #fafafa; padding: 15px; margin-top: 20px; margin-bottom: 15px; }
            .solution p { margin: 0; font-size: ${fontSize}px; line-height: 1.6; color: #e74c3c; }
            img { max-width: 100%; max-height: 250px; display: block; margin: 10px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
    `;

    for (let i = 0; i < mistakes.length; i++) {
      const mistake = mistakes[i];
      let imgTag = '';
      if (mistake.image_uri && mistake.needs_image) {
        try {
          const base64Data = await FileSystem.readAsStringAsync(mistake.image_uri, { encoding: 'base64' });
          imgTag = `<img src="data:image/jpeg;base64,${base64Data}" />`;
        } catch (imgError) {
          console.error("PDF image load error", imgError);
        }
      }

      const displayAnswer = (includeSolution && mistake.answer) ? ` ${mistake.answer} ` : '      ';
      htmlContent += `
        <div class="mistake">
          <div class="question">(${displayAnswer}) ${i + 1}. ${mistake.question.replace(/\n/g, '<br>')}</div>
          ${imgTag}
          ${includeSolution && mistake.solution ? `
            <div class="solution">
              <p>${mistake.solution.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
        </div>
      `;
    }

    htmlContent += `</body></html>`;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    // Rename file
    const modeName = includeSolution ? '含解答' : '練習卷';
    const filename = `錯題複習卷_${modeName}_${getFormattedDate()}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.moveAsync({ from: uri, to: newUri });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
};

export const exportToWord = async (mistakes, includeSolution = false, fontSize = 16) => {
  try {
    const children = [];
    const docxSize = fontSize * 2; // docx uses half-points

    for (let i = 0; i < mistakes.length; i++) {
      const m = mistakes[i];
      const displayAnswer = (includeSolution && m.answer) ? ` ${m.answer} ` : '      ';
      const qText = `(${displayAnswer}) ${i + 1}. ${m.question}`;
      
      children.push(new Paragraph({
        children: [
          new TextRun({ text: qText, size: docxSize })
        ],
        spacing: { after: 200 }
      }));

      if (m.image_uri && m.needs_image) {
        try {
          const base64Data = await FileSystem.readAsStringAsync(m.image_uri, { encoding: 'base64' });
          children.push(new Paragraph({
            children: [
              new ImageRun({
                data: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)),
                transformation: {
                  width: 400,
                  height: 300
                }
              })
            ],
            spacing: { after: 200 }
          }));
        } catch (imgError) {
          console.log("Failed to add image to word doc", imgError);
        }
      }

      if (includeSolution && m.solution) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: m.solution, color: "FF0000", size: docxSize })
          ],
          spacing: { after: 800 } // Larger spacing after solution
        }));
      } else {
        // Add larger blank space for student to write answers
        for(let j=0; j<5; j++){
          children.push(new Paragraph({ text: "" }));
        }
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children }]
    });

    const base64 = await Packer.toBase64String(doc);
    const modeName = includeSolution ? '含解答' : '練習卷';
    const filename = `錯題複習卷_${modeName}_${getFormattedDate()}.docx`;
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
  } catch (error) {
    console.error("Word Export Error:", error);
    throw error;
  }
};
