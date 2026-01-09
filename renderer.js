const imageApi = window.steamImage || window.htmlToImage || null;

const toPng = (...args) => {
  if (!imageApi?.toPng) {
    throw new Error('Image export is unavailable.');
  }
  return imageApi.toPng(...args);
};

const toJpeg = (...args) => {
  if (!imageApi?.toJpeg) {
    throw new Error('Image export is unavailable.');
  }
  return imageApi.toJpeg(...args);
};

const toWebp = (...args) => {
  if (!imageApi?.toWebp) {
    throw new Error('Image export is unavailable.');
  }
  return imageApi.toWebp(...args);
};

const carouselInput = document.getElementById('carousel-input');
const bannerInput = document.getElementById('banner-input');
const carouselViewport = document.getElementById('carousel-viewport');
const carouselCount = document.getElementById('carousel-count');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
const bannerPreview = document.getElementById('banner-preview');
const releaseDateInput = document.getElementById('release-date');
const releaseDateDisplay = document.getElementById('release-date-display');
const exportHtmlButton = document.getElementById('export-html');

let carouselItems = [];
let carouselIndex = 0;
let activeEditable = null;

const saveAssetFile = async (file) => {
  if (window.steamApi?.saveAsset) {
    return window.steamApi.saveAsset({
      sourcePath: file.path,
      originalName: file.name
    });
  }

  return {
    url: URL.createObjectURL(file)
  };
};

const renderCarousel = () => {
  carouselViewport.innerHTML = '';

  if (carouselItems.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'carousel__placeholder';
    placeholder.textContent = 'Drop in up to 10 screenshots or videos.';
    carouselViewport.appendChild(placeholder);
  } else {
    const item = carouselItems[carouselIndex];
    if (item.type.startsWith('video')) {
      const video = document.createElement('video');
      video.src = item.url;
      video.controls = true;
      video.playsInline = true;
      carouselViewport.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = 'Carousel media';
      carouselViewport.appendChild(img);
    }
  }

  carouselCount.textContent = `${carouselItems.length} / 10 media loaded`;
};

const updateReleaseDate = (dateValue) => {
  if (!dateValue) {
    return;
  }
  const date = new Date(dateValue);
  const formatted = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
  releaseDateDisplay.textContent = formatted;
};

carouselInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files).slice(0, 10 - carouselItems.length);
  const savedItems = await Promise.all(
    files.map(async (file) => {
      const result = await saveAssetFile(file);
      return {
        type: file.type,
        url: result.url
      };
    })
  );

  carouselItems = carouselItems.concat(savedItems);

  if (carouselItems.length > 0) {
    carouselIndex = carouselItems.length - 1;
  }

  renderCarousel();
  carouselInput.value = '';
});

bannerInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }
  const result = await saveAssetFile(file);
  const img = document.createElement('img');
  img.src = result.url;
  bannerPreview.innerHTML = '';
  bannerPreview.appendChild(img);
});

carouselPrev.addEventListener('click', () => {
  if (carouselItems.length === 0) {
    return;
  }
  carouselIndex = (carouselIndex - 1 + carouselItems.length) % carouselItems.length;
  renderCarousel();
});

carouselNext.addEventListener('click', () => {
  if (carouselItems.length === 0) {
    return;
  }
  carouselIndex = (carouselIndex + 1) % carouselItems.length;
  renderCarousel();
});

releaseDateInput.addEventListener('change', (event) => {
  updateReleaseDate(event.target.value);
});

const toolbarButtons = document.querySelectorAll('.toolbar button');

const runCommand = (command) => {
  if (command === 'createLink') {
    const url = prompt('Enter URL');
    if (!url) {
      return;
    }
    document.execCommand(command, false, url);
    return;
  }
  document.execCommand(command, false, null);
};

toolbarButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const command = button.dataset.command;
    if (activeEditable) {
      activeEditable.focus();
      runCommand(command);
    }
  });
});

const editableBlocks = document.querySelectorAll('[contenteditable="true"]');
editableBlocks.forEach((block) => {
  block.addEventListener('focus', () => {
    activeEditable = block;
  });
});

const getExportNode = () => {
  const page = document.getElementById('page');
  const clone = page.cloneNode(true);
  clone.querySelectorAll('[data-export="omit"]').forEach((node) => node.remove());
  return clone;
};

const exportImage = async (format) => {
  const node = getExportNode();
  node.style.margin = '0';
  node.style.boxShadow = 'none';
  node.style.width = `${document.getElementById('page').offsetWidth}px`;

  let dataUrl;
  if (format === 'jpg') {
    dataUrl = await toJpeg(node, { quality: 0.92 });
  } else if (format === 'webp') {
    dataUrl = await toWebp(node, { quality: 0.92 });
  } else {
    dataUrl = await toPng(node);
  }

  await window.steamApi.saveImage({ dataUrl, format });
};

const exportHtml = async () => {
  const page = getExportNode();
  page.querySelectorAll('[contenteditable]').forEach((node) => {
    node.removeAttribute('contenteditable');
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Steam Yourself Export</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  ${page.outerHTML}
</body>
</html>`;

  await window.steamApi.saveHtml({ html });
};

const exportButtons = document.querySelectorAll('[data-export-image]');
exportButtons.forEach((button) => {
  button.addEventListener('click', () => {
    exportImage(button.dataset.exportImage);
  });
});

exportHtmlButton.addEventListener('click', exportHtml);

renderCarousel();
