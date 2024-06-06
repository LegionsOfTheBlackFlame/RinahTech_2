document.addEventListener('DOMContentLoaded', async () => {
    try {
        const fetchedData = await fetch('/announcement_content');
        const announcement = await fetchedData.text();
        // console.log(announcement);
       
    } catch (error) {
        throw error;
    }
    try {
        await fetch('/fetch_tokens_from_database');
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
                    // Render rating stars
                    for (let j = 0; j < 5; j++) {
                        const star = document.createElement('span');
                        star.classList.add('star');
                        star.textContent = j < review.Score ? '★' : '☆';
                        ratingStars.appendChild(star);
                    }
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
        const fetchedData = await fetch('/service_cards_content');
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
        const hero = document.querySelector('.hero-text');
        const fetchedData = await fetch('/hero_content');
        if (!fetchedData.ok) {
            throw new Error('Network response was not ok ' + fetchedData.statusText);
        }
        let heroContent = await fetchedData.json();

        const heroTitle = hero.querySelector('h1');
        const heroText = hero.querySelector('p');

        const titleContent = heroContent.find(item => item.content_role === 'title');
        const textContent = heroContent.find(item => item.content_role === 'content_1');

        if (titleContent) heroTitle.textContent = titleContent.content;
        if (textContent) heroText.textContent = textContent.content;
    } catch (error) {
        console.error('Error fetching hero content:', error);
    }

    document.getElementById("hero_btn").addEventListener("click", function() {
        window.location.href = "/hero_page";
    });
});
