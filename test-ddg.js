const term = "Naruto Uzumaki Anime Hard";

async function run() {
  console.log("Fetching DDG...");
  const initRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(term)}&iax=images&ia=images`, {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' 
    }
  });
  
  const html = await initRes.text();
  const vqdMatch = html.match(/vqd=([^&"']+)/) || html.match(/vqd["']:["']([^"']+)["']/);
  
  if (!vqdMatch) {
    console.log("No VQD token found in HTML!");
    return;
  }
  
  const vqd = vqdMatch[1];
  console.log("Found VQD:", vqd);
  
  const imgRes = await fetch(
    `https://duckduckgo.com/i.js?q=${encodeURIComponent(term)}&vqd=${vqd}&f=,,,,,&p=1`,
    { headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Referer': 'https://duckduckgo.com/' 
    } }
  );
  
  if (!imgRes.ok) {
    console.log("Image API Failed:", imgRes.status);
    return;
  }
  
  const data = await imgRes.json();
  console.log("Images found:", data?.results?.length);
  if (data?.results?.length > 0) {
    console.log("First image:", data.results[0].image);
  }
}

run();
