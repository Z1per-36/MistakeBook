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

export const exportToPDF = async (mistakes, includeSolution = false) => {
  try {
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .mistake { margin-bottom: 60px; page-break-inside: avoid; }
            .question { font-size: 16px; margin-bottom: 20px; line-height: 1.8; }
            .solution { background: #fafafa; padding: 15px; border-left: 4px solid #2ecc71; margin-top: 20px; margin-bottom: 15px; }
            .solution p { margin: 0; line-height: 1.6; color: #27ae60; }
            .solution-title { font-weight: bold; margin-bottom: 8px; color: #2ecc71; }
            img { max-width: 100%; max-height: 250px; display: block; margin: 10px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
    `;

    mistakes.forEach((mistake, index) => {
      htmlContent += `
        <div class="mistake">
          <div class="question">(   ) ${index + 1}. ${mistake.question.replace(/\n/g, '<br>')}</div>
          ${mistake.image_uri ? `<img src="${mistake.image_uri}" />` : ''}
          ${includeSolution && mistake.solution ? `
            <div class="solution">
              <div class="solution-title">【解答與解析】</div>
              <p>${mistake.solution.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
        </div>
      `;
    });

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

export const exportToWord = async (mistakes, includeSolution = false) => {
  try {
    const children = [];

    for (let i = 0; i < mistakes.length; i++) {
      const m = mistakes[i];
      const qText = `(   ) ${i + 1}. ${m.question}`;
      
      children.push(new Paragraph({
        children: [
          new TextRun({ text: qText, size: 24 }) // size 24 = 12pt
        ],
        spacing: { after: 200 }
      }));

      if (m.image_uri) {
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
            new TextRun({ text: "【解答與解析】", bold: true, color: "27ae60", size: 22 })
          ],
          spacing: { before: 100, after: 100 }
        }));
        
        children.push(new Paragraph({
          children: [
            new TextRun({ text: m.solution, color: "2c3e50", size: 22 })
          ],
          spacing: { after: 400 }
        }));
      } else {
        // Add blank space for student to write answers only if no solution is provided
        for(let j=0; j<3; j++){
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
