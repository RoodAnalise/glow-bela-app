export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const GLOW_BELA_COLORS: BrandColors = {
  primary: '#B86579',
  secondary: '#D4A5AA',
  accent: '#E6B8C2',
  background: '#E8E0DE',
  text: '#1E1E1E',
};

export type PostFormat = 'story' | 'feed';

const FORMAT_SIZES: Record<PostFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  feed: { width: 1080, height: 1080 },
};

export function generatePostImage(
  image: HTMLImageElement,
  productName: string,
  category: string,
  format: PostFormat,
  colors: BrandColors = GLOW_BELA_COLORS,
  storyText?: string
): Promise<string> {
  return new Promise((resolve) => {
    const { width, height } = FORMAT_SIZES[format];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors.background);
    gradient.addColorStop(0.5, colors.accent);
    gradient.addColorStop(1, colors.background);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative circles
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.15, width * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.15, height * 0.85, width * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Product image area
    const imgPadding = width * 0.1;
    const imgSize = format === 'story' ? width * 0.6 : width * 0.55;
    const imgX = (width - imgSize) / 2;
    const imgY = format === 'story' ? height * 0.15 : height * 0.1;

    // Image shadow/glow
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    // Rounded rectangle for image
    const radius = imgSize * 0.08;
    ctx.beginPath();
    ctx.moveTo(imgX + radius, imgY);
    ctx.lineTo(imgX + imgSize - radius, imgY);
    ctx.quadraticCurveTo(imgX + imgSize, imgY, imgX + imgSize, imgY + radius);
    ctx.lineTo(imgX + imgSize, imgY + imgSize - radius);
    ctx.quadraticCurveTo(imgX + imgSize, imgY + imgSize, imgX + imgSize - radius, imgY + imgSize);
    ctx.lineTo(imgX + radius, imgY + imgSize);
    ctx.quadraticCurveTo(imgX, imgY + imgSize, imgX, imgY + imgSize - radius);
    ctx.lineTo(imgX, imgY + radius);
    ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
    ctx.closePath();
    ctx.clip();

    // Draw product image
    const scale = Math.max(imgSize / image.width, imgSize / image.height);
    const scaledW = image.width * scale;
    const scaledH = image.height * scale;
    const drawX = imgX + (imgSize - scaledW) / 2;
    const drawY = imgY + (imgSize - scaledH) / 2;
    ctx.drawImage(image, drawX, drawY, scaledW, scaledH);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Border around image
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(imgX + radius, imgY);
    ctx.lineTo(imgX + imgSize - radius, imgY);
    ctx.quadraticCurveTo(imgX + imgSize, imgY, imgX + imgSize, imgY + radius);
    ctx.lineTo(imgX + imgSize, imgY + imgSize - radius);
    ctx.quadraticCurveTo(imgX + imgSize, imgY + imgSize, imgX + imgSize - radius, imgY + imgSize);
    ctx.lineTo(imgX + radius, imgY + imgSize);
    ctx.quadraticCurveTo(imgX, imgY + imgSize, imgX, imgY + imgSize - radius);
    ctx.lineTo(imgX, imgY + radius);
    ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
    ctx.closePath();
    ctx.stroke();

    // Brand logo area
    const logoY = format === 'story' ? height * 0.05 : height * 0.03;
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${width * 0.04}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✨ GLOW BELA', width / 2, logoY + width * 0.04);

    // Category badge
    const badgeY = imgY + imgSize + width * 0.05;
    ctx.fillStyle = colors.primary;
    const badgeWidth = ctx.measureText(category.toUpperCase()).width + width * 0.1;
    const badgeHeight = width * 0.045;
    const badgeX = (width - badgeWidth) / 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${width * 0.025}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(category.toUpperCase(), width / 2, badgeY + badgeHeight * 0.7);

    // Product name
    const nameY = badgeY + badgeHeight + width * 0.06;
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${width * 0.06}px serif`;
    ctx.textAlign = 'center';
    wrapText(ctx, productName, width / 2, nameY, width * 0.8, width * 0.07);

    // Story text or CTA
    if (format === 'story' && storyText) {
      const storyY = nameY + width * 0.15;
      ctx.fillStyle = colors.primary;
      ctx.font = `bold ${width * 0.045}px sans-serif`;
      ctx.fillText(storyText, width / 2, storyY);
    }

    // CTA button
    const ctaY = format === 'story' ? height * 0.88 : height * 0.85;
    const ctaWidth = width * 0.6;
    const ctaHeight = width * 0.07;
    const ctaX = (width - ctaWidth) / 2;
    ctx.fillStyle = colors.text;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${width * 0.03}px sans-serif`;
    ctx.fillText('COMPRE AGORA', width / 2, ctaY + ctaHeight * 0.65);

    // Decorative sparkles
    ctx.fillStyle = colors.primary;
    ctx.globalAlpha = 0.3;
    drawSparkle(ctx, width * 0.1, height * 0.3, width * 0.03);
    drawSparkle(ctx, width * 0.9, height * 0.6, width * 0.025);
    drawSparkle(ctx, width * 0.85, height * 0.25, width * 0.02);
    ctx.globalAlpha = 1;

    resolve(canvas.toDataURL('image/png', 0.95));
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.3, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.3, y);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x, y + size * 0.3);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y - size * 0.3);
  ctx.closePath();
  ctx.fill();
}

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function enhanceProductImage(imageBase64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 800;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Background gradient (Glow Bela brand)
      const bgGradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
      bgGradient.addColorStop(0, '#FFF5F7');
      bgGradient.addColorStop(0.5, '#F8E8EC');
      bgGradient.addColorStop(1, '#E8D5DA');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, size, size);

      // Decorative circles
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#B86579';
      ctx.beginPath();
      ctx.arc(size * 0.85, size * 0.15, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.12, size * 0.88, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.75, size * 0.82, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Product image area (centered, with padding)
      const padding = size * 0.12;
      const imgAreaSize = size - padding * 2;

      // Shadow for product image
      ctx.shadowColor = 'rgba(184, 101, 121, 0.25)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;

      // Rounded rectangle clip for product
      const radius = imgAreaSize * 0.06;
      const imgX = padding;
      const imgY = padding;

      ctx.beginPath();
      ctx.moveTo(imgX + radius, imgY);
      ctx.lineTo(imgX + imgAreaSize - radius, imgY);
      ctx.quadraticCurveTo(imgX + imgAreaSize, imgY, imgX + imgAreaSize, imgY + radius);
      ctx.lineTo(imgX + imgAreaSize, imgY + imgAreaSize - radius);
      ctx.quadraticCurveTo(imgX + imgAreaSize, imgY + imgAreaSize, imgX + imgAreaSize - radius, imgY + imgAreaSize);
      ctx.lineTo(imgX + radius, imgY + imgAreaSize);
      ctx.quadraticCurveTo(imgX, imgY + imgAreaSize, imgX, imgY + imgAreaSize - radius);
      ctx.lineTo(imgX, imgY + radius);
      ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
      ctx.closePath();
      ctx.clip();

      // White background inside the product area
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(imgX, imgY, imgAreaSize, imgAreaSize);

      // Draw product image (cover fit)
      const scale = Math.max(imgAreaSize / img.width, imgAreaSize / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const drawX = imgX + (imgAreaSize - scaledW) / 2;
      const drawY = imgY + (imgAreaSize - scaledH) / 2;

      // Apply slight brightness/contrast enhancement
      ctx.filter = 'brightness(1.05) contrast(1.02) saturate(1.08)';
      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
      ctx.filter = 'none';

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Border around product area
      ctx.strokeStyle = '#D4A5AA';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(imgX + radius, imgY);
      ctx.lineTo(imgX + imgAreaSize - radius, imgY);
      ctx.quadraticCurveTo(imgX + imgAreaSize, imgY, imgX + imgAreaSize, imgY + radius);
      ctx.lineTo(imgX + imgAreaSize, imgY + imgAreaSize - radius);
      ctx.quadraticCurveTo(imgX + imgAreaSize, imgY + imgAreaSize, imgX + imgAreaSize - radius, imgY + imgAreaSize);
      ctx.lineTo(imgX + radius, imgY + imgAreaSize);
      ctx.quadraticCurveTo(imgX, imgY + imgAreaSize, imgX, imgY + imgAreaSize - radius);
      ctx.lineTo(imgX, imgY + radius);
      ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
      ctx.closePath();
      ctx.stroke();

      // Inner subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      const innerOffset = 4;
      ctx.beginPath();
      ctx.moveTo(imgX + radius + innerOffset, imgY + innerOffset);
      ctx.lineTo(imgX + imgAreaSize - radius - innerOffset, imgY + innerOffset);
      ctx.quadraticCurveTo(imgX + imgAreaSize - innerOffset, imgY + innerOffset, imgX + imgAreaSize - innerOffset, imgY + radius + innerOffset);
      ctx.lineTo(imgX + imgAreaSize - innerOffset, imgY + imgAreaSize - radius - innerOffset);
      ctx.quadraticCurveTo(imgX + imgAreaSize - innerOffset, imgY + imgAreaSize - innerOffset, imgX + imgAreaSize - radius - innerOffset, imgY + imgAreaSize - innerOffset);
      ctx.lineTo(imgX + radius + innerOffset, imgY + imgAreaSize - innerOffset);
      ctx.quadraticCurveTo(imgX + innerOffset, imgY + imgAreaSize - innerOffset, imgX + innerOffset, imgY + imgAreaSize - radius - innerOffset);
      ctx.lineTo(imgX + innerOffset, imgY + radius + innerOffset);
      ctx.quadraticCurveTo(imgX + innerOffset, imgY + innerOffset, imgX + radius + innerOffset, imgY + innerOffset);
      ctx.closePath();
      ctx.stroke();

      // Glow Bela watermark
      ctx.fillStyle = 'rgba(184, 101, 121, 0.15)';
      ctx.font = 'bold 28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ GLOW BELA', size / 2, size - 30);

      // Decorative sparkles
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#B86579';
      drawSparkle(ctx, size * 0.08, size * 0.12, 12);
      drawSparkle(ctx, size * 0.92, size * 0.25, 10);
      drawSparkle(ctx, size * 0.15, size * 0.78, 8);
      drawSparkle(ctx, size * 0.88, size * 0.72, 14);
      ctx.globalAlpha = 1;

      // Small decorative dots
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#D4A5AA';
      ctx.beginPath();
      ctx.arc(size * 0.05, size * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.95, size * 0.45, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.05, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(imageBase64);
    img.src = imageBase64;
  });
}
