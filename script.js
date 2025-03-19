document.addEventListener('DOMContentLoaded', function() {
    // 检查浏览器是否支持必要的API
    if (!window.FileReader || !window.File || !window.FileList || !window.Blob) {
        alert('您的浏览器不支持文件上传功能，请使用更现代的浏览器');
        return;
    }

    // 检查Canvas支持
    const canvas = document.createElement('canvas');
    if (!canvas.getContext) {
        alert('您的浏览器不支持Canvas，请使用更现代的浏览器');
        return;
    }

    // 获取DOM元素
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const subtitleText = document.getElementById('subtitleText');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const fontFamily = document.getElementById('fontFamily');
    const textColor = document.getElementById('textColor');
    const bgOpacity = document.getElementById('bgOpacity');
    const bgOpacityValue = document.getElementById('bgOpacityValue');
    const bgColor = document.getElementById('bgColor');
    const generateBtn = document.getElementById('generateBtn');
    const resultSection = document.getElementById('resultSection');
    const previewContainer = document.getElementById('previewContainer');
    const downloadBtn = document.getElementById('downloadBtn');

    // 原始图片
    let originalImage = null;
    // 保存最终生成的图片
    let finalImage = null;

    // 更新字体大小显示
    fontSize.addEventListener('input', function() {
        fontSizeValue.textContent = `${this.value}px`;
    });

    // 更新背景透明度显示
    bgOpacity.addEventListener('input', function() {
        bgOpacityValue.textContent = `${this.value}%`;
    });

    // 图片上传预览
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // 检查文件大小（限制为10MB）
            if (file.size > 10 * 1024 * 1024) {
                alert('图片大小不能超过10MB');
                return;
            }

            const reader = new FileReader();
            
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    // 检查图片尺寸
                    if (img.width > 4096 || img.height > 4096) {
                        alert('图片尺寸过大，请使用更小的图片');
                        return;
                    }
                    
                    originalImage = img;
                    
                    // 显示预览
                    imagePreview.innerHTML = '';
                    const previewImg = document.createElement('img');
                    previewImg.src = event.target.result;
                    previewImg.style.maxWidth = '100%';
                    previewImg.style.height = 'auto';
                    imagePreview.appendChild(previewImg);
                };
                
                img.onerror = function() {
                    alert('图片加载失败，请重试');
                };
                
                img.src = event.target.result;
            };
            
            reader.onerror = function() {
                alert('文件读取失败，请重试');
            };
            
            reader.readAsDataURL(file);
        }
    });

    // 生成拼图按钮点击事件
    generateBtn.addEventListener('click', async function() {
        try {
            if (!originalImage) {
                alert('请先上传图片');
                return;
            }

            const lines = subtitleText.value.trim().split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                alert('请输入至少一行字幕文字');
                return;
            }

            // 禁用按钮，显示加载状态
            generateBtn.disabled = true;
            generateBtn.textContent = '生成中...';

            // 获取当前设置的样式
            const styles = {
                fontSize: parseInt(fontSize.value),
                fontFamily: fontFamily.value,
                textColor: textColor.value,
                bgColor: bgColor.value,
                bgOpacity: parseInt(bgOpacity.value) / 100
            };

            // 创建拼图
            const img = await createPuzzle(originalImage, lines, styles);
            
            // 保存最终图片
            finalImage = img;
            
            // 显示预览
            previewContainer.innerHTML = '';
            const previewImg = document.createElement('img');
            previewImg.src = img.src;
            previewImg.style.maxWidth = '100%';
            previewImg.style.height = 'auto';
            previewContainer.appendChild(previewImg);
            
            // 显示结果区域
            resultSection.style.display = 'block';
            
            // 滚动到结果区域
            resultSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('创建拼图失败:', error);
            alert('创建拼图失败，请重试');
        } finally {
            // 恢复按钮状态
            generateBtn.disabled = false;
            generateBtn.textContent = '生成拼图';
        }
    });

    // 下载按钮点击事件
    downloadBtn.addEventListener('click', function() {
        if (!finalImage) {
            alert('请先生成拼图');
            return;
        }

        try {
            // 使用保存的最终Canvas对象（如果存在）
            if (window.finalCanvas) {
                const link = document.createElement('a');
                link.download = '字幕拼图_' + new Date().getTime() + '.png';
                link.href = window.finalCanvas.toDataURL('image/png', 1.0);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }
            
            // 如果没有保存的Canvas，使用原来的方法
            const previewImg = finalImage;
            
            // 创建临时canvas获取完整尺寸的图片数据
            const canvas = document.createElement('canvas');
            
            // 明确设置canvas尺寸为预览图像的自然尺寸
            canvas.width = previewImg.naturalWidth || previewImg.width;
            canvas.height = previewImg.naturalHeight || previewImg.height;
            
            // 获取渲染上下文
            const ctx = canvas.getContext('2d');
            
            // 清除canvas并填充白色背景
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 确保绘制完整图像
            ctx.drawImage(previewImg, 0, 0);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = '字幕拼图_' + new Date().getTime() + '.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            
            // 添加到DOM并触发点击
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('下载图片时出错:', error);
            alert('下载图片时出错，请重试');
        }
    });

    // 创建拼图的函数
    async function createPuzzle(originalImg, textLines, styles) {
        // 反转行顺序，从后往前处理
        const reversedLines = [...textLines].reverse();
        
        // 创建图片数组，保存每行文字生成的图片
        const images = [];
        
        // 依次处理每行文字
        for (let i = 0; i < reversedLines.length; i++) {
            const line = reversedLines[i];
            const img = await createImageWithText(originalImg, line, styles);
            images.push(img);
        }

        // 拼接所有图片
        return combineImages(images, styles.fontSize);
    }

    // 创建图片对象时确保跨域问题不会影响canvas
    function createImageObject(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // 处理可能的跨域问题
            img.onload = () => resolve(img);
            img.src = src;
        });
    }

    // 在图片底部添加文字
    function createImageWithText(originalImg, text, styles) {
        return new Promise((resolve) => {
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = originalImg.width;
            canvas.height = originalImg.height; // 保持与原图一致
            
            const ctx = canvas.getContext('2d');
            
            // 绘制原图
            ctx.drawImage(originalImg, 0, 0);
            
            // 计算文字区域的高度 - 使用文字大小和30%图片高度的较大值，但不超过30%
            const fontSize = styles.fontSize;
            // 计算合适的文字区域高度 (文字大小 + 适当的上下内边距)
            const textHeightWithPadding = fontSize + Math.ceil(fontSize * 1.2); // 文字大小加上120%作为内边距
            // 图片高度的30%
            const maxTextAreaHeight = Math.floor(originalImg.height * 0.3);
            // 取两者较小值确保不超过30%
            const textAreaHeight = Math.min(textHeightWithPadding, maxTextAreaHeight);
            
            const textAreaY = originalImg.height - textAreaHeight; // 文字区域起始Y坐标
            
            // 设置文字背景
            ctx.fillStyle = hexToRgba(styles.bgColor, styles.bgOpacity);
            ctx.fillRect(0, textAreaY, canvas.width, textAreaHeight);
            
            // 设置文字样式
            ctx.fillStyle = styles.textColor;
            ctx.font = `${styles.fontSize}px ${styles.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 绘制文字
            ctx.fillText(
                text, 
                canvas.width / 2, 
                textAreaY + textAreaHeight / 2
            );
            
            // 转换为图片对象
            createImageObject(canvas.toDataURL('image/png')).then(resolve);
        });
    }

    // 垂直拼接图片
    function combineImages(images, fontSize) {
        return new Promise((resolve) => {
            if (images.length === 0) {
                return resolve(null);
            }
            
            const width = images[0].width;
            const height = images[0].height;
            
            // 计算文字区域的高度 - 与createImageWithText保持一致
            const textHeightWithPadding = fontSize + Math.ceil(fontSize * 1.2); 
            const maxTextAreaHeight = Math.floor(height * 0.3);
            const textAreaHeight = Math.min(textHeightWithPadding, maxTextAreaHeight);
            
            // 计算最终图片的总高度
            // 图片1的完整高度 + 其他所有图片的文字区域高度之和
            const totalHeight = height + (images.length - 1) * textAreaHeight;
            
            // 创建最终canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = totalHeight;
            
            const ctx = canvas.getContext('2d');
            
            // 打印画布尺寸信息
            console.log("最终画布尺寸:", width, "x", totalHeight);
            console.log("文字区域高度:", textAreaHeight);
            
            // 从底到顶绘制图片，确保层次正确
            
            // 先绘制所有非文字区域，从下到上（图片5到图片2）
            for (let i = 0; i < images.length - 1; i++) {
                // 每层图片的位置
                const layerY = totalHeight - (i + 1) * textAreaHeight - (height - textAreaHeight);
                
                // 只绘制原图部分，不包括文字区域
                ctx.drawImage(
                    images[i],
                    0, 0, // 源图片原图部分起始位置
                    width, height - textAreaHeight, // 源图片原图部分尺寸
                    0, layerY, // 目标位置
                    width, height - textAreaHeight // 目标尺寸
                );
            }
            
            // 绘制最顶层图片(图片1)完整图片
            if (images.length > 1) {
                ctx.drawImage(
                    images[images.length - 1],
                    0, 0,
                    width, height,
                    0, 0,
                    width, height
                );
            }
            
            // 再绘制所有文字区域，确保文字不被覆盖（图片5到图片2）
            for (let i = 0; i < images.length - 1; i++) {
                // 文字区域的位置
                const textY = totalHeight - (i + 1) * textAreaHeight;
                
                // 绘制文字区域
                ctx.drawImage(
                    images[i],
                    0, height - textAreaHeight, // 源图片文字区域的位置
                    width, textAreaHeight, // 源图片文字区域的尺寸
                    0, textY, // 目标位置
                    width, textAreaHeight // 目标尺寸
                );
            }
            
            // 保存canvas引用到全局变量，便于直接访问
            window.finalCanvas = canvas;
            
            // 创建最终图像
            const img = new Image();
            img.onload = function() {
                // 保存图像的自然尺寸
                img.naturalWidth = canvas.width;
                img.naturalHeight = canvas.height;
                resolve(img);
            };
            img.src = canvas.toDataURL('image/png');
        });
    }

    // 将16进制颜色转换为带透明度的rgba
    function hexToRgba(hex, opacity) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
}); 