import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
// import { Document, Packer, Paragraph, TextRun } from 'docx';

export const exportToPDF = async (mistakes) => {
  try {
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
            .mistake { margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #eaeaea; padding: 15px; border-radius: 8px; }
            .subject { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 10px; display: inline-block; background: #eee; padding: 4px 8px; border-radius: 4px; }
            .question { font-size: 16px; margin-bottom: 15px; font-weight: bold; }
            .solution { background: #fafafa; padding: 15px; border-left: 4px solid #000; margin-bottom: 15px; }
            .solution p { margin: 0; line-height: 1.6; }
            img { max-width: 100%; max-height: 350px; display: block; margin: 10px auto; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>My Mistake Book</h1>
    `;

    for (const mistake of mistakes) {
      // In Expo Print, local file:// URIs usually work directly in img tags
      htmlContent += `
        <div class="mistake">
          <div class="subject">${mistake.subject}</div>
          <div class="question">${mistake.question}</div>
          <div class="solution">
            <p>${mistake.solution ? mistake.solution.replace(/\n/g, '<br>') : 'No solution provided.'}</p>
          </div>
          ${mistake.image_uri ? `<img src="${mistake.image_uri}" />` : ''}
        </div>
      `;
    }

    htmlContent += `</body></html>`;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
};

export const exportToWord = async (mistakes) => {
  try {
    /*
    const children = [
      new Paragraph({
        children: [
          new TextRun({ text: "My Mistake Book", bold: true, size: 36 })
        ]
      })
    ];

    for (const m of mistakes) {
      children.push(new Paragraph({ text: "" })); // spacing
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `[${m.subject}]`, bold: true, size: 28 })
        ]
      }));
      children.push(new Paragraph({ text: `Question: ${m.question}` }));
      children.push(new Paragraph({ text: `Solution: ${m.solution}` }));
      children.push(new Paragraph({ text: "----------------------------------------" }));
    }

    const doc = new Document({
      sections: [{ properties: {}, children }]
    });

    const base64 = await Packer.toBase64String(doc);
    const uri = FileSystem.documentDirectory + "Mistakes.docx";
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    */
    console.log("Word export temporarily disabled");
  } catch (error) {
    console.error("Word Export Error:", error);
    throw error;
  }
};
