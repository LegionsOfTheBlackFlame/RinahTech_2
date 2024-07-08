document.addEventListener('DOMContentLoaded', async () => {
    const targetElement = document.getElementById('about_main');
    try {
        const fetchResponse = await fetch('/about_content');
        if (!fetchResponse.ok) {
            throw new Error('Network response was not ok ' + fetchResponse.statusText);
        }
        let aboutContent = await fetchResponse.json();
        
        const containerElement = document.createElement('div');
        containerElement.classList.add("about-container");
        let titleContent = aboutContent.find(item => item.field === "title");
        const aboutHeaderElement = document.createElement('h3');
        aboutHeaderElement.innerHTML = titleContent.content;
        const contentContainer = document.createElement("div");
        contentContainer.classList.add("content-container");
        contentContainer.appendChild(aboutHeaderElement);
        
        for (let i = 0; i < 2; i++) {
            const paragraphItem = document.createElement('p');
            console.log(aboutContent[i]);
           
            paragraphItem.innerText = aboutContent[i].content;
           contentContainer.appendChild(paragraphItem);
           
        }
       const parentContainer = document.createElement('div');
       parentContainer.classList.add("parent-container");
       parentContainer.appendChild(contentContainer);
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
        const imageElement = document.createElement('img');
        imageElement.src = "https://storage.googleapis.com/sealeon/IMG_7138-cropped.JPG";
        imageElement.classList.add("about-image");
        imageContainer.appendChild(imageElement);
        parentContainer.appendChild(imageContainer);
        containerElement.appendChild(parentContainer);
        
        const contentContainer2 = document.createElement('div');
        contentContainer2.classList.add('content-container-2');

        for (let i = 2; i < 4; i++) {
            const paragraphItem = document.createElement('p');
            console.log(aboutContent[i]);
           
            paragraphItem.innerText = aboutContent[i].content;
           contentContainer2.appendChild(paragraphItem);
           
        }
        containerElement.appendChild(contentContainer2);
        targetElement.appendChild(containerElement);
       

    } catch (error) { throw error}
});