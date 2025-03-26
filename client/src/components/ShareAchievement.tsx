import React, { useState, useRef } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Copy, Check, Download } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Penguin } from '@shared/schema';
import html2canvas from 'html2canvas';

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
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  if (!isOpen) return null;

  const shareUrl = window.location.href;
  const [shareText, setShareText] = useState(penguin 
    ? `I spotted the ${penguin.name} on Penguin Tracker! ${shareUrl}`
    : `I've spotted ${count} out of ${total} penguin species on Penguin Tracker! ${shareUrl}`);

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Close button */}
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
          
          {/* Shareable Card Preview */}
          <div 
            ref={shareCardRef}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 shadow-sm mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <img src="/logo.png" alt="Penguin Tracker Logo" className="w-12 h-12" />
              <div className="text-sm text-gray-500">Penguin Tracker</div>
            </div>
            
            <div className="text-center mb-4">
              {penguin ? (
                <div className="flex flex-col items-center">
                  <div className="rounded-full overflow-hidden h-32 w-32 border-4 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)] mb-3">
                    <img 
                      src={penguin.imageUrl}
                      alt={penguin.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold mt-2">I spotted the {penguin.name}!</h3>
                </div>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2" 
                    style={{backgroundColor: getBadgeColor(), color: 'white'}}>
                    <span className="text-3xl font-bold">{count}</span>
                  </div>
                  <h3 className="text-xl font-bold">{message}</h3>
                  <p className="text-sm text-gray-600 mt-1">{count} of {total} penguin species</p>
                </>
              )}
            </div>
            
            <div className="text-center text-sm">
              {penguin ? (
                <div className="bg-white bg-opacity-70 rounded p-2">
                  <p><strong>Scientific Name:</strong> {penguin.scientificName}</p>
                  <p><strong>Location:</strong> {penguin.location}</p>
                </div>
              ) : (
                <p className="italic text-blue-800">View all 18 penguin species at penguintracker.app</p>
              )}
            </div>
          </div>
          
          {/* Sharing Options */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            <button 
              onClick={shareToTwitter}
              className="flex flex-col items-center justify-center bg-[#1DA1F2] text-white p-2 rounded-lg hover:bg-[#1a91da] transition-colors"
            >
              <Twitter className="h-6 w-6" />
              <span className="text-xs mt-1">Twitter</span>
            </button>
            
            <button 
              onClick={shareToFacebook}
              className="flex flex-col items-center justify-center bg-[#4267B2] text-white p-2 rounded-lg hover:bg-[#3a5a99] transition-colors"
            >
              <Facebook className="h-6 w-6" />
              <span className="text-xs mt-1">Facebook</span>
            </button>
            
            <button 
              onClick={shareToWhatsApp}
              className="flex flex-col items-center justify-center bg-[#25D366] text-white p-2 rounded-lg hover:bg-[#20c35a] transition-colors"
            >
              <FaWhatsapp className="h-6 w-6" />
              <span className="text-xs mt-1">WhatsApp</span>
            </button>
            
            <button 
              onClick={shareToLinkedIn}
              className="flex flex-col items-center justify-center bg-[#0077B5] text-white p-2 rounded-lg hover:bg-[#0069a1] transition-colors"
            >
              <Linkedin className="h-6 w-6" />
              <span className="text-xs mt-1">LinkedIn</span>
            </button>
            
            <button 
              onClick={copyToClipboard}
              className="flex flex-col items-center justify-center bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
              <span className="text-xs mt-1">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          
          {/* Image generation and download */}
          <div className="flex flex-col items-center">
            {!imageSrc ? (
              <button
                onClick={generateImage}
                disabled={isGeneratingImage}
                className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
              >
                {isGeneratingImage ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Generate Shareable Image
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col items-center">
                <img src={imageSrc} alt="Shareable achievement" className="mb-4 rounded-lg max-w-full max-h-36 object-contain" />
                <div className="flex gap-3">
                  <button
                    onClick={downloadImage}
                    className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="mr-2 h-4 w-4" />
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
                      className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}