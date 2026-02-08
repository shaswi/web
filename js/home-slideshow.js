document.addEventListener('DOMContentLoaded', () => {
    initHomeSlideshow();
});

async function initHomeSlideshow() {
    const slideshowContainer = document.getElementById('home-slideshow-bg');
    if (!slideshowContainer) return;

    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let validImages = [];
    const maxImagesToCheck = 10; // Check a, b, c, d, e, f, g, h, i, j

    // Check for images named a.jpg/png, b.jpg/png, etc.
    for (let i = 0; i < maxImagesToCheck; i++) {
        const letter = alphabet[i];

        // Check JPG
        let exists = await checkImageExists(`photo/${letter}.jpg`);
        if (exists) {
            validImages.push(`photo/${letter}.jpg`);
            continue;
        }

        // Check PNG
        exists = await checkImageExists(`photo/${letter}.png`);
        if (exists) {
            validImages.push(`photo/${letter}.png`);
        } else {
            // Stop if gap found? Or check a few more?
            // "a,b,c,d..." implies sequential. 
            // If 'a' and 'c' exist but 'b' is missing, do we show?
            // Let's stop at the first gap to avoid checking all 26 letters unnecessarily
            // unless 'a' is missing.
            if (validImages.length > 0) break;
        }
    }

    if (validImages.length === 0) return;

    // Create slides
    validImages.forEach((src, index) => {
        const div = document.createElement('div');
        div.className = 'home-slide';
        div.style.backgroundImage = `url('${src}')`;
        if (index === 0) div.classList.add('active');
        slideshowContainer.appendChild(div);
    });

    // Start rotation
    let currentSlide = 0;
    const slides = document.querySelectorAll('.home-slide');

    if (slides.length > 1) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 6000); // 6 seconds per slide
    }
}

function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}
