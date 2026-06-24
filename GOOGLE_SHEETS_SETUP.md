# Google Sheets Results Setup

Use this when you want quiz results to append to a private Google Sheet.

## 1. Create the Sheet

Create a Google Sheet named `Candidate Assessment Results`.

Rename the first tab to:

```text
Results
```

Add these headers in row 1:

```text
Timestamp
Name
Test Type
Score
Total Questions
Percentage
Total Time
Away Time
Tab Switches
Wrong Answers
Tab Switch Details
Exit Points
User Agent
Page URL
```

## 2. Add the Apps Script

In the Sheet, go to `Extensions` > `Apps Script`, delete any starter code, and paste this:

```js
const SHEET_NAME = 'Results';

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(`Missing sheet tab: ${SHEET_NAME}`);
  }

  const data = JSON.parse(e.postData.contents || '{}');

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.testType || '',
    data.score ?? '',
    data.totalQuestions ?? '',
    data.percentage || '',
    data.totalTime || '',
    data.totalAwayTime || '',
    data.tabSwitches ?? '',
    JSON.stringify(data.wrongAnswers || []),
    JSON.stringify(data.tabSwitchDetails || []),
    JSON.stringify(data.exitPoints || []),
    data.userAgent || '',
    data.pageUrl || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Save the project.

## 3. Deploy the Script

In Apps Script:

1. Click `Deploy` > `New deployment`.
2. Select type: `Web app`.
3. Description: `Candidate assessment result receiver`.
4. Execute as: `Me`.
5. Who has access: `Anyone`.
6. Click `Deploy`.
7. Copy the Web App URL.

The Sheet stays private. The Web App URL is only the receiver endpoint.

## 4. Add the URL to the App

Open:

```text
client/public/app-config.js
```

Paste the Web App URL:

```js
window.APP_CONFIG = {
  GOOGLE_SHEETS_WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
};
```

Then commit and push. GitHub Pages will redeploy automatically.
