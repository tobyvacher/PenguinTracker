import React, { useState } from 'react';
import { Facebook, Copy, Check, Mail } from 'lucide-react';
import { FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import { useTheme } from '@/contexts/ThemeContext';

interface SocialShareButtonsProps {
  shareText: string;
  sharePlatforms?: ('x' | 'facebook' | 'whatsapp' | 'copy' | 'email')[];
  className?: string;
  buttonStyle?: 'grid' | 'row';
}

export default function SocialShareButtons({
  shareText,
  sharePlatforms = ['x', 'facebook', 'whatsapp', 'copy', 'email'],
  className = '',
  buttonStyle = 'grid'
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
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
  
  const handlePlatformShare = (platform: string) => {
    const shareUrl = window.location.href;
    
    switch(platform) {
      case 'x':
        // X (Twitter)
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        safeWindowOpen(twitterUrl);
        break;
      case 'facebook':
        // Facebook
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        safeWindowOpen(facebookUrl);
        break;
      case 'whatsapp':
        // WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        safeWindowOpen(whatsappUrl);
        break;
      case 'email':
        // Email
        const subject = 'Check out my achievement on Penguin Tracker!';
        const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        safeWindowOpen(emailUrl);
        break;
      default:
        break;
    }
  };
  
  // Container class based on buttonStyle
  const containerClass = buttonStyle === 'grid' 
    ? 'grid grid-cols-5 gap-3'
    : 'flex flex-wrap gap-3 justify-center';
  
  return (
    <div className={`${containerClass} ${className}`}>
      {/* X (formerly Twitter) */}
      {sharePlatforms.includes('x') && (
        <button 
          onClick={() => handlePlatformShare('x')}
          className={`flex flex-col items-center justify-center ${
            isDark 
              ? 'bg-black' 
              : 'bg-[#1D9BF0]'
          } text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md`}
        >
          <FaXTwitter className="h-6 w-6" />
          <span className="text-xs font-medium mt-1">X</span>
        </button>
      )}
      
      {/* Facebook */}
      {sharePlatforms.includes('facebook') && (
        <button 
          onClick={() => handlePlatformShare('facebook')}
          className={`flex flex-col items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-r from-[#4267B2] to-[#3b5998]' 
              : 'bg-[#1877F2]'
          } text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md`}
        >
          <Facebook className="h-6 w-6" />
          <span className="text-xs font-medium mt-1">Facebook</span>
        </button>
      )}
      
      {/* WhatsApp */}
      {sharePlatforms.includes('whatsapp') && (
        <button 
          onClick={() => handlePlatformShare('whatsapp')}
          className={`flex flex-col items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E]' 
              : 'bg-[#25D366]'
          } text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md`}
        >
          <FaWhatsapp className="h-6 w-6" />
          <span className="text-xs font-medium mt-1">WhatsApp</span>
        </button>
      )}
      
      {/* Copy Link */}
      {sharePlatforms.includes('copy') && (
        <button 
          onClick={copyToClipboard}
          className={`flex flex-col items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-r from-gray-600 to-gray-800' 
              : 'bg-gray-500'
          } text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md`}
        >
          {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
          <span className="text-xs font-medium mt-1">{copied ? "Copied!" : "Copy"}</span>
        </button>
      )}
      
      {/* Email */}
      {sharePlatforms.includes('email') && (
        <button 
          onClick={() => handlePlatformShare('email')}
          className={`flex flex-col items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : 'bg-red-500'
          } text-white p-3 rounded-lg hover:opacity-90 transition-opacity shadow-md`}
        >
          <Mail className="h-6 w-6" />
          <span className="text-xs font-medium mt-1">Email</span>
        </button>
      )}
    </div>
  );
}