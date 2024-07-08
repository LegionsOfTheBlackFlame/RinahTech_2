
function setActiveLanguage(language) {
    localStorage.setItem('preferredLanguage', Number(language));
};


function getActiveLanguage() {
    return localStorage.getItem('preferredLanguage') || 1; // Default to English if not set
};

document.addEventListener('DOMContentLoaded', async () => {
    let activeLanguage = 1;
    try { activeLanguage =  getActiveLanguage();
        
        const langPicker = document.getElementById('lang_picker');
        langPicker.addEventListener('change', (event) => {
            setActiveLanguage(event.target.value);
        })} catch(error) {console.error}
   
    try {
        const fetchedData = await fetch(`/announcement_content?lang=${activeLanguage}`);
        const announcement = await fetchedData.text();
        // console.log(announcement);
       
    } catch (error) {
        throw error;
    }
    try {
        
        const reviewsFetchResponse = await fetch('/google_reviews');
        if (!reviewsFetchResponse.ok) {
            throw new Error('Network response was not ok ' + reviewsFetchResponse.statusText);
        }
        let reviews = await reviewsFetchResponse.json();
       
        // Filter out reviews with no Original_text
        reviews = reviews.filter(review => review.Original_text && review.Original_text.trim().length > 0);

        let currentIndex = 0;

        function renderReviews() {
            const profilesContainer = document.getElementById('profiles-container');
            const reviewerName = document.getElementById('reviewer-name');
            const reviewText = document.getElementById('review-text');
            const ratingStars = document.getElementById('rating-stars');
            
            profilesContainer.innerHTML = '';
            ratingStars.innerHTML = '';

            for (let i = 0; i < 11; i++) {
                const reviewIndex = (currentIndex + i) % reviews.length;
                const review = reviews[reviewIndex];
                const img = document.createElement('img');
                img.src = `/proxy?url=${encodeURIComponent(review.User_image_url)}`;
                img.classList.add('profile');
                if (i === 5) {
                    img.classList.add('active');
                    reviewText.textContent = review.Original_text;
                    reviewerName.textContent = review.User_name;
                    const starsContainer = document.createElement('div');
                    starsContainer.classList = "stars-contianer";

                    // Render rating stars
                    for (let j = 0; j < 5; j++) {
                        const star = document.createElement('span');
                        star.classList.add('star');
                        star.textContent = j < review.Score ? '★' : '☆';
                        starsContainer.appendChild(star);
                    }
                    ratingStars.appendChild(starsContainer);
                }
                profilesContainer.appendChild(img);
            }
        }

        function rotateReviews() {
            currentIndex = (currentIndex + 1) % reviews.length;
            renderReviews();
        }

        renderReviews();
        setInterval(rotateReviews, 2000); // Change review every 10 seconds
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }

    try {
        const fetchedData = await fetch(`/service_cards_content?lang=${activeLanguage}`);
        if (!fetchedData.ok) {
            throw new Error('Network response was not ok ' + fetchedData.statusText);
        }
        let cardsContent = await fetchedData.json();
    
        cardsContent.forEach((service, index) => {
            const card = document.getElementById(`service-card${index + 1}`);
            const imgDiv = card.querySelector('.service-img');
            const title = card.querySelector('.service-info h3');
            const description = card.querySelector('.service-info p');
            const button = card.querySelector('button');
    
            imgDiv.style.backgroundImage = `url(${service.media_url})`;
            title.textContent = service.service_card_title;
            description.textContent = service.service_card_content;
            button.id = service.service_card_role;  // Set the button id to service_card_role
    
            // Add event listener to the button
            button.addEventListener('click', function() {
                // Redirect to the desired URL (customize as needed)
                window.location.href = `/${service.service_card_role}`;
            });
        });
    
    } catch (error) {
        console.error('Error fetching service card content:', error);
    }
    
    try {
        console.log(activeLanguage);
        const hero = document.querySelector('.hero-text');
        const fetchedData = await fetch(`/hero_content?lang=${activeLanguage}`);
        if (!fetchedData.ok) {
            throw new Error('Network response was not ok ' + fetchedData.statusText);
        }
        let heroContent = await fetchedData.json();

        const heroTitle = hero.querySelector('h1');
        const heroText = hero.querySelector('p');
        const heroBackGround = document.getElementById('hero');

        const titleContent = heroContent.find(item => item.content_role === 'title');
        const textContent = heroContent.find(item => item.content_role === 'content_1');
        const heroImageContent = heroContent.find(item => item.content_role === 'img_1');

        if (titleContent) heroTitle.textContent = titleContent.content;
        if (textContent) heroText.textContent = textContent.content;
        console.log(heroImageContent.content);
        if (heroImageContent) heroBackGround.style.backgroundImage = `url(${heroImageContent.content})`;
        
    } catch (error) {
        console.error('Error fetching hero content:', error);
    }

    document.getElementById("hero_btn").addEventListener("click", function() {
        window.location.href = "/hero_page";
    });

    try {
        const response = await fetch(`/about_content?lang=${activeLanguage}`);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        let aboutContent = await response.json();
        let targetElement = document.getElementById('about_sect');
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
        const aboutBtn = document.createElement('button');
        aboutBtn.innerText ="Read More...";
        aboutBtn.addEventListener('click', function() {
            window.location.href = "/about_page";
        })
        contentContainer.appendChild(aboutBtn);
        containerElement.appendChild(contentContainer);
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
        const imageElement = document.createElement('img');
        imageElement.src = "https://storage.googleapis.com/sealeon/IMG_7138-cropped.JPG";
        imageElement.classList.add("about-image");
        imageContainer.appendChild(imageElement);
        containerElement.appendChild(imageContainer);
        targetElement.appendChild(containerElement);
       

    } catch (error) { throw error}
});
