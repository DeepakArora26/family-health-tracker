// ==========================================
// GOOGLE APPS SCRIPT: SECURE FAMILY HEALTH TRACKER
// ==========================================

// 1. CHANGE THIS PASSWORD to something secure!
const SECRET_PASSWORD = "my-secure-family-password";

// 2. Name of your CSV file in Google Drive
const CSV_FILE_NAME = "FamilyHealthData.csv";

// Helper function to verify the password sent from the frontend
function isAuthenticated(providedPassword) {
  return providedPassword === SECRET_PASSWORD;
}

// Initial setup to create the file if it doesn't exist
function setup() {
  let files = DriveApp.getFilesByName(CSV_FILE_NAME);
  if (!files.hasNext()) {
    let csvContent = "Timestamp,Date,Type,Family_Member,Detail_1,Detail_2,Detail_3,Report_Link,Notes\n";
    DriveApp.createFile(CSV_FILE_NAME, csvContent, MimeType.CSV);
    Logger.log("Created new secure CSV file: " + CSV_FILE_NAME);
  } else {
    Logger.log("Secure CSV file already exists.");
  }
}

function doGet(e) {
  // REQUIRE PASSWORD FOR GET REQUESTS
  const providedPassword = e.parameter.pwd;
  
  // CORS Headers for secure JSON response
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (!isAuthenticated(providedPassword)) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized. Incorrect password." }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    let files = DriveApp.getFilesByName(CSV_FILE_NAME);
    if (!files.hasNext()) {
      return ContentService.createTextOutput(JSON.stringify({ error: "CSV file not found" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    let file = files.next();
    let csvData = Utilities.parseCsv(file.getBlob().getDataAsString());
    
    let csvHeaders = csvData[0];
    let jsonData = [];
    
    for (let i = 1; i < csvData.length; i++) {
      if (csvData[i].length > 1) { 
        let rowObj = {};
        for (let j = 0; j < csvHeaders.length; j++) {
          rowObj[csvHeaders[j]] = csvData[i][j];
        }
        jsonData.push(rowObj);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: jsonData }))
                         .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Handle CORS Preflight Requests automatically sent by browsers
  if (typeof e === 'undefined' || !e.postData) {
    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Parse incoming JSON payload
    let payload = JSON.parse(e.postData.contents);
    
    // REQUIRE PASSWORD FOR POST REQUESTS
    if (!isAuthenticated(payload.pwd)) {
       return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized. Incorrect password." }))
                            .setMimeType(ContentService.MimeType.JSON);
    }

    let files = DriveApp.getFilesByName(CSV_FILE_NAME);
    let file;
    
    if (!files.hasNext()) {
      let csvContent = "Timestamp,Date,Type,Family_Member,Detail_1,Detail_2,Detail_3,Report_Link,Notes\n";
      file = DriveApp.createFile(CSV_FILE_NAME, csvContent, MimeType.CSV);
    } else {
      file = files.next();
    }
    
    let newRow = [
      payload.timestamp || new Date().toISOString(),
      payload.date || "",
      payload.type || "",
      payload.member || "",
      payload.detail1 || "",
      payload.detail2 || "",
      payload.detail3 || "",
      payload.link || "",
      payload.notes || ""
    ];
    
    // Safely escape commas and quotes for CSV format
    let csvRow = newRow.map(cell => {
      let str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(",");
    
    let currentContent = file.getBlob().getDataAsString();
    if (!currentContent.endsWith("\n")) currentContent += "\n";
    
    file.setContent(currentContent + csvRow + "\n");
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// Required to handle CORS OPTIONS requests gracefully
function doOptions(e) {
  let output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}