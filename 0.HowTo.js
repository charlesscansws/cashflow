function testOpenModal() {
    document.getElementById('paymentModal').style.display = 'flex';
}



/**
 * 
 * When I mention "Make Changes Locally", I mean editing the code files on your own computer, specifically in the folder where you set up Clasp and Git (C:\Users\charl\OneDrive\Documents\GAS - REVOLUT).

Since you’re using Clasp, any code changes you make in that local folder can be:

Pushed to Google Apps Script using clasp push, so they appear in the online editor at script.google.com.
Tracked with Git and then pushed to GitHub to back up your project.
Here’s how it works in practice:

Edit Locally: Open and edit your .gs and .html files directly on your computer, using any code editor you prefer (e.g., Visual Studio Code, Notepad++) in the GAS - REVOLUT folder.

Update Google Apps Script:

When you’re ready to update the live Google Apps Script version, run:
bash
Copy code
clasp push
This command will sync your local changes to Google Apps Script.
Back Up to GitHub:

After making and testing your changes, you can also commit them to Git and push them to GitHub as a backup:
bash
Copy code
git add .
git commit -m "Describe the changes you made"
git push
Using Clasp this way lets you develop locally and sync with both Google Apps Script and GitHub, giving you the benefits of version control and a backup.
 */


/**
Node.js

C:\Users\charl>cd "C:\Users\charl\OneDrive\Documents\GAS - REVOLUT"
C:\Users\charl\OneDrive\Documents\GAS - REVOLUT>clasp pull
C:\Users\charl\OneDrive\Documents\GAS - REVOLUT>clasp push

git remote -v
git remote add https://github.com/charlesscansws/GAS-Revolut.git



git add .
git commit -m "Describe the changes you made"
git push

git add .
git commit -m "add counterparty"
git push

 */




