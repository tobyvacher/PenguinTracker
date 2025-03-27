import React, { useState, useRef } from 'react';
import { Share2, Facebook, Copy, Check, Download, Mail } from 'lucide-react';
import { FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import { Penguin } from '@shared/schema';
import html2canvas from 'html2canvas';
import { useTheme } from '@/contexts/ThemeContext';

interface ShareAchievementProps {
  title: string;
  message: string;
  count?: number;
  total?: number;
  penguin?: Penguin;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareAchievement({
  title,
  message,
  count,
  total = 18,
  penguin,
  isOpen,
  onClose
}: ShareAchievementProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const shareUrl = window.location.href;
  const defaultShareText = penguin 
    ? `I spotted the ${penguin.name} on Penguin Tracker! ${shareUrl}`
    : `I've spotted ${count} out of ${total} penguin species on Penguin Tracker! ${shareUrl}`;
    
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shareText, setShareText] = useState(defaultShareText);

  if (!isOpen) return null;

  // Helper function to safely open a URL
  const safeWindowOpen = (url: string) => {
    try {
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error opening URL:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateImage = async () => {
    if (!shareCardRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false
      });
      const image = canvas.toDataURL('image/png');
      setImageSrc(image);
      
      // Update the share text to include mention of the attached image
      const imageText = penguin
        ? `I spotted the ${penguin.name} on Penguin Tracker! Check out my screenshot. ${shareUrl}`
        : `I've spotted ${count} out of ${total} penguin species on Penguin Tracker! Check out my achievement. ${shareUrl}`;
      setShareText(imageText);
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadImage = () => {
    if (!imageSrc) return;
    
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = penguin 
      ? `penguin-tracker-${penguin.name.toLowerCase().replace(/\s+/g, '-')}.png`
      : `penguin-tracker-achievement-${count}-of-${total}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeColor = () => {
    if (!count) return "#FFD700"; // Default gold
    if (count >= 18) return "#FF9500"; // Gold/orange
    if (count >= 15) return "#9C56F6"; // Purple
    if (count >= 10) return "#3B82F6"; // Blue
    if (count >= 5) return "#22C55E"; // Green
    return "#6B7280"; // Gray
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 py-12">
        <div className={`relative w-full max-w-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-2xl my-8`}>
          {/* Close button in the corner */}
          <div className="absolute top-3 right-3 z-10">
            <button 
              className={`${isDark ? 'bg-gray-700 text-gray-300 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'} rounded-full p-1.5 shadow-md transition-colors`}
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <h2 className={`text-2xl font-bold text-center mb-4 pr-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
          
            {/* Shareable Card Preview */}
            <div 
              ref={shareCardRef}
              className="relative bg-gradient-to-br from-blue-600 to-indigo-800 rounded-lg p-6 shadow-xl mb-6 overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-yellow-300"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-blue-300"></div>
                <div className="absolute right-1/3 bottom-1/4 w-20 h-20 rounded-full bg-white"></div>
              </div>
              
              {/* Content */}
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img src="/logo.png" alt="Penguin Tracker Logo" className="w-16 h-16 object-contain bg-white p-1 rounded-full shadow-lg" />
                    <div className="ml-2">
                      <div className="text-white font-bold text-lg">Penguin Tracker</div>
                      <div className="text-blue-200 text-xs">Explore • Discover • Protect</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  {penguin ? (
                    <div className="flex flex-col items-center">
                      <div className="rounded-full overflow-hidden h-36 w-36 border-4 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.8)] mb-3">
                        <img 
                          src={penguin.imageUrl}
                          alt={penguin.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-white text-indigo-900 font-bold text-xl px-4 py-2 rounded-full mt-2 shadow-lg">
                        I spotted the {penguin.name}!
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                        style={{backgroundColor: getBadgeColor()}}>
                        <span className="text-5xl font-bold text-white">{count}</span>
                      </div>
                      <div className="bg-white bg-opacity-90 text-indigo-900 font-bold text-xl px-6 py-3 rounded-full mb-2 inline-block shadow-lg">
                        {message}
                      </div>
                      <div className="flex items-center justify-center bg-indigo-900 bg-opacity-60 rounded-full px-4 py-1 mx-auto w-max">
                        <span className="text-xs font-medium text-white">{count} of {total} penguin species</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="text-center">
                  {penguin ? (
                    <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-indigo-900"><span className="font-bold">Scientific Name:</span> {penguin.scientificName}</p>
                      <p className="font-medium text-indigo-900"><span className="font-bold">Location:</span> {penguin.location}</p>
                    </div>
                  ) : (
                    <p className="text-white font-medium bg-indigo-700 bg-opacity-50 rounded-lg py-2 px-4 mt-2">
                      Visit <span className="font-bold">penguintracker.app</span> to explore all {total} penguin species!
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {!imageSrc && (
              <div className={`mb-6 p-4 rounded-lg ${isDark 
                ? 'border border-blue-800 bg-blue-900/30 text-blue-100' 
                : 'border border-blue-100 bg-blue-50 text-blue-700'}`}>
                <p className={`text-sm ${isDark ? 'text-blue-100' : 'text-blue-700'} mb-1`}>
                  <strong>Step 1:</strong> Generate an image using the button below to share on social media.
                </p>
                <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
                  After generating, you'll be able to download the image or share it directly.
                </p>
              </div>
            )}
            
            {/* Image generation and download */}
            <div className="flex flex-col items-center">
              {!imageSrc ? (
                <button
                  onClick={generateImage}
                  disabled={isGeneratingImage}
                  className="flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-70 shadow-md font-medium text-lg"
                >
                  {isGeneratingImage ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Your Image...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-5 w-5" />
                      Create Shareable Image
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <div className={`mb-4 p-2 rounded-lg shadow-sm ${isDark 
                  ? 'bg-gradient-to-r from-indigo-900/50 to-blue-900/50' 
                  : 'bg-gradient-to-r from-indigo-100 to-blue-100'}`}>
                    <img src={imageSrc} alt="Shareable achievement" className="rounded-lg max-w-full max-h-48 object-contain shadow-md" />
                  </div>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={downloadImage}
                      className="flex items-center justify-center bg-gradient-to-r from-emerald-600 to-green-600 text-white px-5 py-2.5 rounded-lg hover:from-emerald-700 hover:to-green-700 transition-colors shadow-md font-medium"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download
                    </button>
                    
                    {typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator && (
                      <button
                        onClick={async () => {
                          try {
                            // Convert base64 to blob
                            const res = await fetch(imageSrc);
                            const blob = await res.blob();
                            
                            const file = new File([blob], 
                              penguin ? `penguin-${penguin.name}.png` : `penguin-achievement-${count}.png`, 
                              { type: 'image/png' }
                            );
                            
                            const shareData = {
                              title: title,
                              text: shareText,
                              files: [file]
                            };
                            
                            if (navigator.canShare && navigator.canShare(shareData)) {
                              await navigator.share(shareData);
                            } else {
                              // Fallback to just sharing text if files aren't supported
                              await navigator.share({
                                title: title,
                                text: shareText,
                                url: window.location.href
                              });
                            }
                          } catch (err) {
                            console.error('Error sharing: ', err);
                          }
                        }}
                        className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md font-medium"
                      >
                        <Share2 className="mr-2 h-5 w-5" />
                        Share
                      </button>
                    )}
                  </div>
                  
                  {/* Social sharing with image */}
                  <div className="mb-2 mt-1 text-center">
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Share on social media</p>
                  </div>
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    {/* X (formerly Twitter) */}
                    <button 
                      onClick={async () => {
                        try {
                          const twitterText = penguin 
                            ? `I spotted the ${penguin.name} on Penguin Tracker! Check out my screenshot.`
                            : `I've spotted ${count} out of ${total} penguin species on Penguin Tracker! Check out my achievement.`;
                          
                          const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(window.location.href)}`;
                          safeWindowOpen(shareUrl);
                        } catch (err) {
                          console.error('Error sharing to X (Twitter):', err);
                        }
                      }}
                      className="flex flex-col items-center justify-center bg-black text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md"
                    >
                      <FaXTwitter className="h-6 w-6" />
                      <span className="text-xs font-medium mt-1">X</span>
                    </button>
                    
                    {/* Facebook */}
                    <button 
                      onClick={async () => {
                        try {
                          const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
                          safeWindowOpen(shareUrl);
                        } catch (err) {
                          console.error('Error sharing to Facebook:', err);
                        }
                      }}
                      className="flex flex-col items-center justify-center bg-gradient-to-r from-[#4267B2] to-[#3b5998] text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md"
                    >
                      <Facebook className="h-6 w-6" />
                      <span className="text-xs font-medium mt-1">Facebook</span>
                    </button>
                    
                    {/* WhatsApp */}
                    <button 
                      onClick={async () => {
                        try {
                          const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                          safeWindowOpen(shareUrl);
                        } catch (err) {
                          console.error('Error sharing to WhatsApp:', err);
                        }
                      }}
                      className="flex flex-col items-center justify-center bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md"
                    >
                      <FaWhatsapp className="h-6 w-6" />
                      <span className="text-xs font-medium mt-1">WhatsApp</span>
                    </button>
                    
                    {/* Copy Link */}
                    <button 
                      onClick={copyToClipboard}
                      className="flex flex-col items-center justify-center bg-gradient-to-r from-gray-600 to-gray-800 text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md"
                    >
                      {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                      <span className="text-xs font-medium mt-1">{copied ? "Copied!" : "Copy"}</span>
                    </button>
                    
                    {/* Email */}
                    <button 
                      onClick={async () => {
                        try {
                          const subject = penguin 
                            ? `I spotted the ${penguin.name} on Penguin Tracker!`
                            : `I've spotted ${count} out of ${total} penguin species on Penguin Tracker!`;
                          
                          const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
                          safeWindowOpen(emailUrl);
                        } catch (err) {
                          console.error('Error sharing via email:', err);
                        }
                      }}
                      className="flex flex-col items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md"
                    >
                      <Mail className="h-6 w-6" />
                      <span className="text-xs font-medium mt-1">Email</span>
                    </button>
                  </div>
                  <p className={`text-xs text-center mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Some platforms may ask you to add the downloaded image manually</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}