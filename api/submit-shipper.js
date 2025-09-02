// api/submit-shipper.js
// Secure serverless function for Shipper form submissions

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers for your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // Get data from request body
    const {
      companyName,
      contactName,
      email,
      phone,
      abn,
      notes
    } = req.body;

    // Basic validation
    if (!companyName || !contactName || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: Company Name, Contact Name, Email, Phone' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Prepare data for Airtable
    const airtableData = {
      fields: {
        'Company Name': companyName,
        'Contact Name': contactName,
        'Email': email,
        'Phone': phone,
        'ABN': abn || '',
        'Status': 'Pending',
        'Date Created': new Date().toISOString().split('T')[0],
        'Notes': notes || 'New shipper signup from website - interested in listing container space'
      }
    };

    // Submit to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/tblNuf5EqROr3a0nf`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableData)
      }
    );

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable error:', errorData);
      throw new Error('Failed to save to database');
    }

    const savedRecord = await airtableResponse.json();
    
    // Log successful submission (for monitoring)
    console.log(`New Shipper signup: ${companyName} (${email}) - Record ID: ${savedRecord.id}`);

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Shipper registration successful! We\'ll contact you within 24 hours to discuss your container capacity.',
      recordId: savedRecord.id
    });

  } catch (error) {
    console.error('Shipper submission error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again or contact esocustomerx@gmail.com'
    });
  }
}
