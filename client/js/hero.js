document.addEventListener('DOMContentLoaded', async () => {
    try {
        const fetchedData = await fetch('/hero_content');
        if (!fetchedData.ok) {
            throw new Error('Network response was not ok ' + fetchedData.statusText);
        }
        const heroContent =  await fetchedData.json();
        const contentContainer = document.getElementById('hero_main');
        const heroTitle = document.createElement('h1');
        const title = heroContent.find(item => item.content_role === 'title');
        heroTitle.innerHTML = title.content;
        contentContainer.appendChild(heroTitle);
        const paragraphData = heroContent.filter(item => /^content_\d+$/.test(item.content_role));

        paragraphData.forEach(item => {
            const pElement = document.createElement('p');
            pElement.textContent = item.content;
            pElement.id = item.content_role;  // Optionally set the ID to content_role

            contentContainer.appendChild(pElement);
        });
    } catch (error) {
        throw error;
    }
})