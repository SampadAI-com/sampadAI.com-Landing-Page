const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to get country from IP using free API
async function getCountryFromIP(ip) {
  try {
    // Skip geolocation for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null;
    }

    // Use ipapi.co - free, reliable, serverless-friendly
    const response = await axios.get(`https://ipapi.co/${ip}/country/`, {
      timeout: 2000, // 2 second timeout
      headers: {
        'User-Agent': 'SampadAI-Landing-Page/1.0'
      }
    });
    
    return response.data?.trim() || null;
  } catch (error) {
    console.warn('Geolocation API failed:', error.message);
    return null;
  }
}

// Language detection middleware
app.use(async (req, res, next) => {
  try {
    // Get client IP (considering proxy headers)
    const clientIP =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      req.ip;

    // Clean IP address (remove IPv6 prefix if present)
    const cleanIP = clientIP ? clientIP.split(',')[0].trim() : '127.0.0.1';

    // Get country code from IP
    const country = await getCountryFromIP(cleanIP);

    // Determine language based on country
    let language = 'en'; // Default to English

    if (country) {
      switch (country) {
        case 'DE':
          language = 'de';
          break;
        case 'PL':
          language = 'pl';
          break;
        default:
          language = 'en';
      }
    }

    // Store language in request object
    req.language = language;
    next();
  } catch (error) {
    console.error('Language detection middleware error:', error);
    // Fallback to English if anything fails
    req.language = 'en';
    next();
  }
});

// Helper function to get messages
const getMessages = () => ({
  en: {
    title: 'SampadAI',
    tagline: 'Because Your Money Deserves an A+ AI',
    comingSoon: 'Coming Soon',
    description:
      'We are building something amazing. Join our waitlist to be the first to know when we launch.',
    emailPlaceholder: 'Enter your email address',
    joinWaitlist: 'Join Waitlist',
    successMessage:
      "Thank you! You've been added to our waitlist. We'll notify you when we launch.",
  },
  de: {
    title: 'SampadAI',
    tagline: 'Weil Ihr Geld eine A+ KI verdient',
    comingSoon: 'Demnächst verfügbar',
    description:
      'Wir entwickeln etwas Großartiges. Treten Sie unserer Warteliste bei, um als Erster zu erfahren, wann wir starten.',
    emailPlaceholder: 'E-Mail-Adresse eingeben',
    joinWaitlist: 'Warteliste beitreten',
    successMessage:
      'Vielen Dank! Sie wurden zu unserer Warteliste hinzugefügt. Wir benachrichtigen Sie, wenn wir starten.',
  },
  pl: {
    title: 'SampadAI',
    tagline: 'Ponieważ Twoje pieniądze zasługują na AI klasy A+',
    comingSoon: 'Wkrótce',
    description:
      'Tworzymy coś niesamowitego. Dołącz do naszej listy oczekujących, aby jako pierwszy dowiedzieć się o naszym uruchomieniu.',
    emailPlaceholder: 'Wprowadź swój adres e-mail',
    joinWaitlist: 'Dołącz do listy',
    successMessage:
      'Dziękujemy! Zostałeś dodany do naszej listy oczekujących. Powiadomimy Cię, gdy uruchomimy serwis.',
  },
});

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    language: req.language,
    messages: getMessages(),
  });
});

// Language-specific routes (optional)
app.get('/en', (req, res) => {
  res.render('index', {
    language: 'en',
    messages: getMessages(),
  });
});

app.get('/de', (req, res) => {
  res.render('index', {
    language: 'de',
    messages: getMessages(),
  });
});

app.get('/pl', (req, res) => {
  res.render('index', {
    language: 'pl',
    messages: getMessages(),
  });
});

// Waitlist route
app.post('/waitlist', (req, res) => {
  const { email } = req.body;

  // Here you would typically save the email to a database
  // For now, we'll just log it and return a success response
  console.log(`New waitlist signup: ${email}`);

  // In a real application, you might:
  // 1. Save to database
  // 2. Send confirmation email
  // 3. Add to email marketing service

  res.json({
    success: true,
    message: 'Successfully added to waitlist!',
  });
});

// Export the app for Vercel
module.exports = app;

// Only start the server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to see the website`);
  });
}
