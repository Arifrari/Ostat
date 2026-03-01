export default async function handler(req, res) {
  // শুধুমাত্র GET রিকোয়েস্ট অ্যালাও করা
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Only GET method allowed" });
  }

  // URL থেকে auth ডাটাটি রিসিভ করা (যেমন: 01980369972:Arif123@)
  const { auth } = req.query;

  // যদি auth না থাকে বা এর ভেতর কোলন (:) না থাকে, তবে এরর দেখাবে
  if (!auth || !auth.includes(':')) {
    return res.status(400).json({ error: "সঠিক ফরম্যাটে লিংকে ডাটা দিন (যেমন: /check/01980369972:Arif123@)" });
  }

  // কোলন (:) দিয়ে নাম্বার এবং পাসওয়ার্ড আলাদা করা
  const parts = auth.split(':');
  const ms = parts[0];
  const ps = parts.slice(1).join(':'); // পাসওয়ার্ডের ভেতর কোলন থাকলেও যেন না ভাঙে

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
      return res.status(401).json({ error: "লগিন ব্যর্থ! সঠিক নাম্বার বা পাসওয়ার্ড দিন।" });
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

    // --- ৩. ডাটা প্রসেসিং করে আপনার কাঙ্ক্ষিত ফরম্যাট তৈরি করা ---
    const totalCourses = secondApiData?.data?.total || 0;
    const courseResults = secondApiData?.data?.results || [];

    // শুধু কোর্সের টাইটেলগুলো বের করে একটি লিস্ট তৈরি করা
    const courseTitles = courseResults.map(course => course?.course_snapshot?.title || "Unknown Course");

    // 'Total Courses: 3' এর সাথে টাইটেলগুলোকে ' | ' দিয়ে যুক্ত করা
    const finalResultString = `Total Courses: ${totalCourses} | ` + courseTitles.join(' | ');

    // --- ৪. রেসপন্স পাঠানো ---
    res.status(200).json({ data: finalResultString });

  } catch (error) {
    res.status(500).json({ error: `সার্ভার এরর: ${error.message}` });
  }
}
