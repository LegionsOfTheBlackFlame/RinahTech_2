async function setActiveLanguage(lang) {
    localStorage.setItem('lang', lang);
}
async function getActiveLanguage() {
    return Number(localStorage.getItem('lang')) || 0;
}
document.addEventListener('DOMContentLoaded', async () => {
    const languagePicker = document.getElementById('lang_picker');
    let activeLang = await getActiveLanguage();
    languagePicker.value = activeLang;
    languagePicker.addEventListener('change', async (event) => {
        const langValue = event.target.value;
        await setActiveLanguage(langValue);
        activeLang = await getActiveLanguage();
        location.reload();
        console.log("language changed ", activeLang);
    });
    try {
        const fetchedData = await fetch(`/hero_content?lang=${activeLang}`);
        if (!fetchedData.ok) {
            throw new Error('Network response was not ok ' + fetchedData.statusText);
        }
        const heroContent = await fetchedData.json();
        const contentContainer = document.getElementById('hero_main');
        const titleContainer = document.getElementById('title');

        // Append the title
        const title = heroContent.find(item => item.field === 'title');
        if (title) {
            const heroTitle = document.createElement('h3');
            heroTitle.innerHTML = title.content;
            titleContainer.appendChild(heroTitle);
        }

        // Filter paragraph and media content
        const paragraphData = heroContent.filter(item => /^content_\d+$/.test(item.field));
        const mediaData = heroContent.filter(item => /^media_\d+$/.test(item.field));

        // Sort content by number
        const sortByRoleNumber = (a, b) => {
            const aNum = parseInt(a.field.match(/\d+$/)[0], 10);
            const bNum = parseInt(b.field.match(/\d+$/)[0], 10);
            return aNum - bNum;
        };

        paragraphData.sort(sortByRoleNumber);
        mediaData.sort(sortByRoleNumber);

        // Merge the paragraph and media data
        const maxLength = Math.max(paragraphData.length, mediaData.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < paragraphData.length) {
                const pElement = document.createElement('div');
                pElement.classList.add('paragraph');
                pElement.classList.add(`test_paragraph${i + 1}`);
                pElement.innerHTML = `<p>${paragraphData[i].content}</p>`;
                pElement.id = `test_paragraph${i + 1}`;
                contentContainer.appendChild(pElement);
            }
            if (i < mediaData.length) {
                const mediaElement = document.createElement('div');
                mediaElement.classList.add('image');
                mediaElement.classList.add(`test-media${i + 1}`);
                mediaElement.id = `test_media${i + 1}`;

                const videoElement = document.createElement('video');
                videoElement.src = mediaData[i].content;
               

                // Set video attributes for autoplay, mute, and loop
                videoElement.autoplay = true;
                videoElement.muted = true;
                videoElement.loop = true;

                mediaElement.appendChild(videoElement);
                contentContainer.appendChild(mediaElement);
            }
        }
    } catch (error) {
        console.error('Error fetching content:', error);
    }
});
