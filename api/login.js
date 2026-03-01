export default async function handler(req, res) {
  // শুধুমাত্র GET রিকোয়েস্ট অ্যালাও করা
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Only GET method allowed" });
  }

  const { ms, ps } = req.query;

  if (!ms || !ps) {
    return res.status(400).json({ error: "ms এবং ps দেওয়া বাধ্যতামূলক!" });
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
    
    // আপনি যদি পিওর JSON ফরম্যাট চান:
    res.status(200).json({ data: finalResultString });

    // (অথবা) আপনি যদি JSON বাদে একদম শুধু টেক্সট লাইনটিই দেখতে চান, তবে উপরের লাইনটি মুছে নিচের লাইনটি ব্যবহার করবেন:
    // res.status(200).send(finalResultString);

  } catch (error) {
    res.status(500).json({ error: `সার্ভার এরর: ${error.message}` });
  }
}
