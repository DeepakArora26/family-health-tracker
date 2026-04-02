# Family Health Hub Pro - Secure Setup Guide

Welcome to **Family Health Hub Pro**! This is a premium, mobile-first web application designed to help you organize your entire family's medical history, active medicines, emergency contacts, and vital signs. 

It is designed to be **100% serverless and private**. You can host the `index.html` file anywhere (like GitHub Pages for free), and the application will save all your data directly to a secure CSV file inside your personal Google Drive!

---

## 🔒 Security Architecture (How your data stays safe)
Because this app is designed to be hosted publicly on GitHub Pages, **the HTML code contains absolutely no sensitive data or URLs.** 

Instead, it relies on a secure "Vault Key" system:
1. You deploy a private `Code.gs` script to your Google Drive and set a **secret password**.
2. When you open the HTML app for the first time, it asks for your Google Script URL and that password.
3. The app saves this password securely in your local browser storage. Every time it reads or writes data to your Drive, it sends this encrypted password. If someone else finds your GitHub link, they just see a locked login screen!

---

## 🛠️ Step-by-Step Setup Instructions

### Phase 1: Configure & Deploy the Backend (Google Drive)

**Good News:** You DO NOT need to manually create a spreadsheet or write any formulas! This is a standalone script that automatically creates and manages a secure Google Sheet for you.

1. Go to [Google Apps Script](https://script.google.com/) and sign in with your Google account.
2. Click the **"New project"** button in the top left.
3. Rename the project (e.g., "Family Health Vault") by clicking "Untitled project" at the top.
4. Open the `Code.gs` file from this repository and copy all the code.
5. In the Google Apps Script editor, delete any existing code and paste the code you just copied.
6. **⚠️ CRITICAL SECURITY STEP:** Look at **Line 6** of the `Code.gs` file:
   ```javascript
   const SECRET_PASSWORD = "my-secure-family-password";
   ```
   Change `"my-secure-family-password"` to a strong, unique password. You will need this password later to unlock the app on your phone!
7. Click the **Save** icon (the floppy disk).
8. **Create the Database:** In the top toolbar, select the `setup` function from the dropdown menu (next to "Debug") and click **"Run"**. 
   - *Note: Google will ask for permissions because this script needs access to your Google Drive to create the Spreadsheet. Click "Review permissions", choose your account, click "Advanced", and click "Go to project".*
9. **Success!** The script has now automatically created a new file in your main Google Drive folder called `FamilyHealthVault` (A Google Sheet with tabs for Medicines, Checkups, etc.). You never have to touch this file manually; the app will do all the reading and writing for you!

### Phase 2: Get your Web App URL

1. In the Google Apps Script editor, look at the top right and click the blue **"Deploy"** button.
2. Select **"New deployment"**.
3. Click the gear icon ⚙️ next to "Select type" and choose **"Web app"**.
4. Fill out the details:
   - **Description:** Version 1
   - **Execute as:** `Me (your email)` *(This ensures it writes to your Drive)*
   - **Who has access:** `Anyone` *(Don't worry, your data is protected by the secret password you set on Line 6!)*
5. Click **"Deploy"**.
6. Google will give you a **Web app URL** (it starts with `https://script.google.com/macros/s/.../exec`). 
7. **Copy this URL!**

### Phase 3: Host & Unlock the Frontend

You do not need to edit the `index.html` file at all!

1. Upload the `index.html` file to a free static host like **GitHub Pages**, Netlify, or Vercel (or simply email it to yourself and open it).
2. Open the URL on your mobile phone or laptop.
3. You will be greeted by the **Secure Vault Setup** screen.
4. Paste the **Web App URL** you copied in Phase 2.
5. Enter the **Secret Password** you created on **Line 6** of `Code.gs`.
6. Click "Unlock Vault".

The app will now securely sync with your Google Drive. 

---

## 📱 Pro Tips for Mobile Use

*   **Install as an App:** When you open the website on your phone's browser (Safari or Chrome), click the Share/Menu button and select **"Add to Home Screen"**. It will install a native-looking app icon on your phone!
*   **Offline Mode:** Once unlocked, the app caches your family's emergency data locally. If you are in a hospital basement with no internet, you can still open the app to see Blood Types, Allergies, and Active Medicines.
*   **Medical ID Generator:** On a family member's profile, click the red "Medical ID Image" button to instantly download an emergency lock-screen wallpaper for your phone.
*   **Print for Doctor:** Click the print button on a profile to instantly format all their active medicines, insurances, and checkups into a clean PDF summary for their physician.