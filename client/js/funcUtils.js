
function setActiveLanguage(language) {
    localStorage.setItem('preferredLanguage', Number(language));
};


function getActiveLanguage() {
    return localStorage.getItem('preferredLanguage') || 1; // Default to English if not set
};

export {getActiveLanguage, setActiveLanguage};