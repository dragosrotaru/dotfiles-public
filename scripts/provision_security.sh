#!/bin/bash
# $1 - new machine name

echo "turn on filevault";
sudo fdesetup enable;

echo "turn on firewall";
sudo defaults write /Library/Preferences/com.apple.alf globalstate -int 2;

echo "install critical updates automatically";
sudo defaults write com.apple.SoftwareUpdate CriticalUpdateInstall -bool true;

echo "disable Guest Login";
sudo defaults write /Library/Preferences/com.apple.loginwindow GuestEnabled -bool false;

echo "set DNS to Quad9";
sudo networksetup -setdnsservers Wi-Fi 9.9.9.9 149.112.112.112 2620:fe::fe 2620:fe::9;

echo "changing ComputerName, localhost and NetBIOSName";
sudo scutil --set ComputerName "$1";
sudo scutil --set LocalHostName "$1";
sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName -string "$1";
sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server ServerDescription -string "$1";

echo "disable Siri";
sudo defaults write com.apple.assistant.support "Assistant Enabled" -bool false;
sudo defaults write com.apple.Siri StatusMenuVisible -bool false;

echo "disable Visual Intelligence"
sudo defaults write com.apple.visualintelligence sendLocationInfo -bool false;
sudo defaults write com.apple.visualintelligence sendOCRText -bool false;
sudo defaults write com.apple.visualintelligence enableScreenshots -bool false;
sudo defaults write com.apple.visualintelligence enableSafariApp -bool false;
sudo defaults write com.apple.visualintelligence enableQuickLook -bool false;
sudo defaults write com.apple.visualintelligence enablePhotosApp -bool false;
sudo defaults write com.apple.visualintelligence enablePetsDomain -bool false;
sudo defaults write com.apple.visualintelligence enableNatureDomain -bool false;
sudo defaults write com.apple.visualintelligence enableLandmarkDomain -bool false;
sudo defaults write com.apple.visualintelligence enableCoarseClassification -bool false;
sudo defaults write com.apple.visualintelligence enableBooksDomain -bool false;
sudo defaults write com.apple.visualintelligence enableArtDomain -bool false;
sudo defaults write com.apple.visualintelligence enableAlbumsDomain -bool false;

echo "disable Sharing"

sudo defaults write com.apple.amp.mediasharingd "home-sharing-enabled" -bool false;
sudo defaults write com.apple.amp.mediasharingd "photo-sharing-enabled" -bool false;
sudo defaults write com.apple.amp.mediasharingd "public-sharing-enabled" -bool false;
sudo defaults write com.apple.amp.mediasharingd "public-sharing-enabled" -bool false;


echo "disable advertising"
sudo defaults write com.apple.AdLib allowApplePersonalizedAdvertising -bool false;
sudo defaults write com.apple.AdLib allowIdentifierForAdvertising -bool false;
sudo defaults write com.apple.AdLib personalizedAdsMigrated -bool false;
