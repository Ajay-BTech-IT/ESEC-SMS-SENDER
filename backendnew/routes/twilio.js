const twilio = require('twilio');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const accountSid = process.env.TWILIO_ACCOUNT_SID ;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

exports.sendMarks = async (student, examType, marks, advisorName, language = 'tamil') => {
  // Build subject-wise marks list
  const subjectMarks = marks.map(mark => {
    const subject = mark.subject;
    const value = mark[examType.toUpperCase()] || '-';
    return `${subject}: ${value}`;
  }).join('\n');

  let messageBody = '';

  if (language === 'hindi' || language === 'bihar') {
    messageBody = `ईरोड सेंगुंदर इंजीनियरिंग कॉलेज\n(स्वायत्त)\nतुडुपति, ईरोड - 638 057\n\nडॉ. वी. वेंकटाचलम\nस्नातक ${student.department} विभाग में ${student.year} वर्ष और ${student.semester} सेमेस्टर में पढ़ रहे\n${student.name}, रोल नंबर: ${student.rollno}, द्वारा आयोजित आंतरिक मूल्यांकन परीक्षा में प्राप्त अंकों का विवरण नीचे दिया गया है।\n\nजिन विषयों में "AB" उल्लेख किया गया है, वे परीक्षाएं नहीं दी गई हैं। 50 अंकों से कम वाले विषयों में छात्र उत्तीर्ण नहीं हुए हैं। यदि यह स्थिति बनी रहती है, तो उन्हें आगामी सेमेस्टर परीक्षा (SEMESTER EXAM) में बैठने की अनुमति नहीं दी जाएगी।\n\nइस संबंध में या किसी अन्य जानकारी के लिए, कृपया कक्षा शिक्षक से संपर्क करें।\n\n${subjectMarks}\n\nसंपर्क करें: ${student.advisorMobile || 'Advisor'}`;
  } else {
    messageBody = `ஈரோடு செங்குந்தர் பொறியியல் கல்லூரி\n(தன்னாட்சி)\nதுடுபதி, ஈரோடு-638 057\n\nமுனைவர் V.VENKATACHALAM\nஇளங்கலை ${student.department}யில் ${student.year}ம் ஆண்டு ${student.semester}ம் பருவத்தில் படிக்கும் ${student.name}, ROLLNO:${student.rollno} நடந்து முடிந்த உள்மதிப்பீட்டு தேர்வில்\n${examType.toUpperCase()} பெற்ற மதிப்பெண்கள் கீழே கொடுக்கப்பட்டுள்ளன. அதில் AB என்று குறிப்பிட்டுள்ள படத்தின் தேர்வை எழுதவில்லை என்றும்,\n50 மதிப்பெண்களுக்கு கீழ் உள்ள பாடங்களில் அவர் தேர்ச்சி பெறவில்லை என்பதை அறியவும். இந்நிலை நீடிக்குமெனில் அவரை வரும் பருவத்தேர்வு\n(SEMESTER EXAM) எழுத அனுமதிக்க இயலாது. இது தொடர்பாக அல்லது ஏதும் தகவல் தேவைப்படும் எனில் வகுப்பு ஆசிரியரை தொடர்பு கொள்ளவும்\n\n${subjectMarks}\n\nதொடர்பு: ${student.advisorMobile || 'Advisor'}`;
  }

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: `whatsapp:+14155238886`,
      to: `whatsapp:${student.whatsapp}`
    });

    console.log(`✅ Message sent to ${student.whatsapp} (SID: ${message.sid})`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error('❌ Twilio send error:', err.message);
    return { success: false, error: err.message };
  }
};

