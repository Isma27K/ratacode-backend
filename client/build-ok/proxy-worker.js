self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith('https://proxy-image/')) {
    event.respondWith(
      fetch(event.request.url.slice(21), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://manganato.com/'
        }
      })
    );
  }
});