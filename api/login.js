export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Only GET method allowed" });
  }

  const { ms, ps } = req.query;

  if (!ms || !ps) {
    return res.status(400).send("<h2 style='color:red; text-align:center;'>ms এবং ps দেওয়া বাধ্যতামূলক!</h2>");
  }

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
    // --- ১. লগিন করে টোকেন আনা ---
    const loginUrl = 'https://api.ostad.app/api/v2/user/login-msisdn'; 
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: headersTemplate,
      body: JSON.stringify({ msisdn: ms, password: ps })
    });
    
    const loginData = await loginRes.json();
    const token = loginData?.data?.accessToken; 

    if (!token) {
      return res.status(401).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: red;">লগিন ব্যর্থ! ❌</h2>
            <p>আপনার দেওয়া নাম্বার বা পাসওয়ার্ড ভুল হতে পারে।</p>
        </div>
      `);
    }

    // --- ২. টোকেন দিয়ে ব্যাচ ডাটা আনা ---
    const secondUrl = 'https://api.ostad.app/api/v2/batch?count=12&page=1&is_on_demand=false';
    const secondRes = await fetch(secondUrl, {
      method: 'GET',
      headers: {
        ...headersTemplate,
        "accesstoken": token 
      }
    });
    
    const secondApiData = await secondRes.json();

    // --- ৩. JSON থেকে নির্দিষ্ট ডাটা বের করা (Data Parsing) ---
    // টোটাল কোর্সের সংখ্যা বের করছি
    const totalCourses = secondApiData?.data?.total || 0;
    
    // কোর্সের লিস্ট বের করছি
    const courseResults = secondApiData?.data?.results || [];
    
    // লুপ চালিয়ে HTML এর জন্য একটি লিস্ট (<li>) তৈরি করছি
    let courseListHTML = '';
    courseResults.forEach((course) => {
      const title = course?.course_snapshot?.title || "Unknown Course";
      courseListHTML += `<li class="course-item">${title}</li>`;
    });


    // --- ৪. ব্রাউজারে সুন্দর করে রেসপন্স দেখানো ---
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>My Courses</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color: #f0f2f5;
                  color: #333;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
              }
              .container {
                  background: white;
                  padding: 30px;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  width: 100%;
                  max-width: 500px;
              }
              .header {
                  color: #1a73e8;
                  margin-top: 0;
                  border-bottom: 2px solid #e8eaed;
                  padding-bottom: 10px;
                  text-align: center;
              }
              .total-box {
                  background: #e8f0fe;
                  color: #1967d2;
                  padding: 10px 15px;
                  border-radius: 8px;
                  font-weight: bold;
                  font-size: 18px;
                  margin-bottom: 20px;
                  display: inline-block;
              }
              ol.course-list {
                  padding-left: 20px;
                  margin: 0;
              }
              li.course-item {
                  background: #f8f9fa;
                  margin-bottom: 10px;
                  padding: 12px 15px;
                  border-radius: 6px;
                  border-left: 4px solid #1a73e8;
                  font-size: 16px;
                  font-weight: 500;
                  transition: transform 0.2s;
              }
              li.course-item:hover {
                  transform: translateX(5px);
                  background: #e1ebf9;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h2 class="header">📚 আপনার কোর্সসমূহ</h2>
              
              <div class="total-box">Total Courses: ${totalCourses}</div>
              
              <ol class="course-list">
                  ${courseListHTML}
              </ol>
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
