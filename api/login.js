export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Only GET method allowed" });
  }

  const { ms, ps } = req.query;

  if (!ms || !ps) {
    return res.status(400).send("<h2 style='color:red; text-align:center;'>ms এবং ps দেওয়া বাধ্যতামূলক!</h2>");
  }

  // আপনার দেওয়া অরিজিনাল হেডারগুলো (সব রিকোয়েস্টে এটাই ব্যবহার হবে)
  const headersTemplate = {
    "User-Agent": "Dart/3.9 (dart:io)",
    "Connection": "keep-alive",
    "Accept": "*/*",
    "x-ostad-app-build": "907",
    "x-ostad-app-version": "2.103.2",
    "fingerprint": "c5a55c04-c5fc-42c0-b597-fce025355ebb",
    "x-ostad-app": "com.ostad.android",
    "content-type": "application/json",
    "metadata": "{\"model\":\"P963F95_A\",\"brand\":\"ZTE\",\"version\":\"34\",\"display\":\"14.11_Z2453_SA\",\"deviceType\":\"android\"}",
    "x-ostad-device-id": "UP1A.231005.007"
  };

  try {
    // --- প্রথম রিকোয়েস্ট (লগিন করে টোকেন আনা) ---
    const loginUrl = 'https://api.ostad.app/api/v2/user/login-msisdn'; 
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: headersTemplate,
      body: JSON.stringify({ msisdn: ms, password: ps })
    });
    
    const loginData = await loginRes.json();
    const token = loginData?.data?.accessToken; 

    // লগিন ফেইল হলে বা টোকেন না পেলে
    if (!token) {
      return res.status(401).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #ffebee;">
            <h2 style="color: red;">লগিন ব্যর্থ! ❌</h2>
            <p>আপনার দেওয়া নাম্বার বা পাসওয়ার্ড ভুল হতে পারে।</p>
        </div>
      `);
    }

    // --- দ্বিতীয় রিকোয়েস্ট (টোকেন দিয়ে ব্যাচ ডাটা আনা) ---
    const secondUrl = 'https://api.ostad.app/api/v2/batch?count=12&page=1&is_on_demand=false';
    const secondRes = await fetch(secondUrl, {
      method: 'GET',
      headers: {
        ...headersTemplate,
        "accesstoken": token // আপনার দেওয়া ফরম্যাট অনুযায়ী সরাসরি টোকেন বসানো হলো
      }
    });
    
    const secondApiData = await secondRes.json();

    // --- ব্রাউজারে সুন্দর করে রেসপন্স দেখানো ---
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Batch API Result</title>
          <style>
              body {
                  font-family: 'Courier New', Courier, monospace;
                  background-color: #1e1e1e;
                  color: #d4d4d4;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                  box-sizing: border-box;
              }
              .container {
                  background: #252526;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                  width: 100%;
                  max-width: 800px;
                  overflow-x: auto;
              }
              .header {
                  color: #4CAF50;
                  margin-top: 0;
                  border-bottom: 1px solid #333;
                  padding-bottom: 10px;
                  font-family: sans-serif;
              }
              pre {
                  font-size: 14px;
                  line-height: 1.5;
                  color: #9CDCFE;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h3 class="header">✅ Batch Data Fetched Successfully!</h3>
              <pre>${JSON.stringify(secondApiData, null, 4)}</pre>
          </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(htmlResponse);

  } catch (error) {
    res.status(500).send(`<h2 style='color:red; text-align:center;'>সার্ভার এরর: ${error.message}</h2>`);
  }
                }
