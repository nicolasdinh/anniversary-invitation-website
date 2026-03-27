// ========================================================
// GOOGLE APPS SCRIPT — Paste this into Google Apps Script
// ========================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://sheets.google.com and create a new spreadsheet
// 2. Name it "Anniversary RSVPs"
// 3. In Row 1, add these headers:
//    A1: Timestamp | B1: Name | C1: Email | D1: Attendance
//    E1: Guest Count | F1: Appetizer Selections | G1: Main Course Selections
//    H1: Dietary Restrictions | I1: Message
// 4. Click Extensions > Apps Script
// 5. Delete any code in the editor and paste ALL of this code
// 6. Click Deploy > New Deployment
// 7. Select type: "Web app"
// 8. Set "Execute as" to "Me"
// 9. Set "Who has access" to "Anyone"
// 10. Click Deploy and copy the URL
// 11. Paste that URL into app.js where it says GOOGLE_SCRIPT_URL
// ========================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var row = [
      new Date().toLocaleString(),
      data.name || '',
      data.email || '',
      data.attendance || '',
      data.guestCount || '',
      data.appetizers || '',
      data.mains || '',
      data.dietary || '',
      data.message || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success', message: 'RSVP endpoint is working' }))
    .setMimeType(ContentService.MimeType.JSON);
}
