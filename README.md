# PCC Passport Autofill Helper

A Chrome extension starter for locally extracting text from some passport PDFs and manually filling matching form fields.

## Privacy and safety
- Passport files and extracted values are processed locally in the extension; they are not sent to a server or saved by the extension.
- The extension requests access to a webpage only after you click **Fill current form**. It does not run on every website in the background.
- It never submits the form. Review every extracted value and field, and submit official applications yourself.
- Never upload passport files, passwords, cookies, or other personal information to GitHub.

## Limitations
- Extraction supports some text-based PDFs. Scanned PDFs and JPG/PNG image OCR are not supported.
- PDF text encoding and website form labels vary, so extraction and field matching may be incomplete or incorrect.
- This project is not affiliated with any government service.

## Install
1. Download or clone this repository and extract it if needed.
2. In Chrome, open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this project folder.
5. Open the relevant form, select a PDF in the extension popup, extract and verify the information, then click **Fill current form**.
6. Review the form carefully. The extension does not submit it.
