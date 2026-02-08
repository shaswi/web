let slideIndex = 1;
let images = [];
const MAX_IMAGES_TO_CHECK = 20; // Limit check to 20 images to prevent infinite 404s

document.addEventListener('DOMContentLoaded', () => {
    loadImages();
});

async function loadImages() {
    const wrapper = document.getElementById('slides-wrapper');
    const dotsWrapper = document.getElementById('dots-wrapper');
    const errorMsg = document.getElementById('error-message');
    const galleryContainer = document.getElementById('gallery-container');

    // Try to load images 1.jpg to 20.jpg
    // Since we can't directory list, we verify existence by loading them

    let validImages = [];

    for (let i = 1; i <= MAX_IMAGES_TO_CHECK; i++) {
        // Check for JPG first
        let exists = await checkImageExists(`photo/${i}.jpg`);
        if (exists) {
            validImages.push(`photo/${i}.jpg`);
        } else {
            // If JPG not found, check for PNG
            exists = await checkImageExists(`photo/${i}.png`);
            if (exists) {
                validImages.push(`photo/${i}.png`);
            }
        }
    }

    // Check for other common formats if no jpg found?
    // Let's stick to .jpg based on "photo" -> "photoes" usually implies jpg/png.
    // Simplifying: Just assume standard names.

    if (validImages.length === 0) {
        galleryContainer.style.display = 'none';
        dotsWrapper.style.display = 'none';
        errorMsg.style.display = 'block';
        return;
    }

    images = validImages;

    // Build HTML
    images.forEach((src, index) => {
        // Slide
        const slide = document.createElement('div');
        slide.className = 'slide';
        if (index === 0) slide.classList.add('active'); // First one active

        const img = document.createElement('img');
        img.src = src;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';

        slide.appendChild(img);
        wrapper.appendChild(slide);

        // Dot
        const dot = document.createElement('span');
        dot.className = 'dot';
        if (index === 0) dot.classList.add('active');
        dot.onclick = () => currentSlide(index + 1);
        dotsWrapper.appendChild(dot);
    });

    showSlides(slideIndex);

    // Auto play
    setInterval(() => {
        changeSlide(1);
    }, 5000); // 5 seconds
}

function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// Navigation
window.changeSlide = function (n) {
    showSlides(slideIndex += n);
}

window.currentSlide = function (n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");

    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
        slides[i].style.display = "none";
    }

    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
    }

    if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].style.display = "block";
        // smooth fade is in css
        setTimeout(() => slides[slideIndex - 1].classList.add("active"), 10);
        dots[slideIndex - 1].classList.add("active");

        // Update caption
        const caption = document.getElementById("caption-text");
        if (caption) caption.innerText = `Photo ${slideIndex} of ${slides.length}`;
    }
}
