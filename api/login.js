export default async function handler(req, res) {
  if (req.method === 'GET') {
    
    // ব্রাউজারের URL থেকে সংক্ষিপ্ত ms এবং ps সংগ্রহ করা
    const { ms, ps } = req.query;

    if (!ms || !ps) {
      return res.status(400).json({ error: "URL-এ ms এবং ps দেওয়া বাধ্যতামূলক।" });
    }

    const targetUrl = 'https://api.ex.app/api/v2/user/login-msisdn';

    // আপনার অ্যাপের হেডার (যেখানে আপনার ZTE ডিভাইসের মেটাডাটা রয়েছে)
    const headers = {
      'x-ostad-app-build': '907',
      'user-agent': 'Dart/3.9 (dart:io)',
      'accesstoken': '',
      'x-ostad-app-version': '2.103.2',
      'fingerprint': '611f20c8-54a4-422a-b31e-6e18f84a6abf',
      'x-ostad-app': 'com.ex.android',
      'content-type': 'application/json',
      'metadata': '{"model":"P963F95_A","brand":"ZTE","version":"34","display":"14.11_Z2453_SA","deviceType":"android"}',
      'x-ostad-device-id': 'UP1A.231005.007'
    };

    // মূল API-কে তাদের পরিচিত msisdn এবং password নামেই ডাটা পাঠানো হচ্ছে
    const body = JSON.stringify({
      msisdn: ms,
      password: ps
    });

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: headers,
        body: body
      });

      const data = await response.json();
      res.status(response.status).json(data);

    } catch (error) {
      res.status(500).json({ error: "API থেকে ডাটা আনতে সমস্যা হয়েছে", details: error.message });
    }
    
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
                                  }
