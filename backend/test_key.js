const apiKey = 'AIzaSyDnADmgGUmXZD_PeopviB4-4A_x-l-sHh0';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function testKey() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Success! The API key is working.');
      const models = data.models
        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
      console.log('Available models for generateContent:');
      console.log(models.join('\n'));
    } else {
      console.error('❌ Error: The API key failed.');
      console.error('Status:', response.status);
      console.error(data.error.message);
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

testKey();
