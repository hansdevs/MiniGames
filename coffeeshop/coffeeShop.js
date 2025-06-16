project="game-landing-page"
file="coffeeshop/coffeeShop.js"
type="code"
window.addEventListener('load', function() {
    console.log('Coffee Shop page loaded. Setting up audio...');

    const audioPath = '../lib/coffeeShop/3_CoffeeBeans.wav'; // Relative path
    const audio = new Audio(audioPath);
    audio.loop = true;
    let isMuted = false; // Track mute state

    const muteButton = document.getElementById('muteButton');
    const startGameButton = document.getElementById('startGameButton');

    function playAudioWithHandling() {
        if (isMuted) {
            console.log('Audio is muted, not playing.');
            return;
        }
        console.log('Attempting to play audio...');
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log('Audio playback started successfully.');
            }).catch(error => {
                console.error('Audio playback failed:', error);
                if (startGameButton) {
                    const playOnClick = () => {
                        if (isMuted) return; // Don't play if muted by the time user clicks
                        audio.play().then(() => {
                            console.log('Audio playing after user interaction.');
                        }).catch(err => {
                            console.error('Still unable to play audio:', err);
                        });
                    };
                    // Use { once: true } if you only want this to fire once for the initial play
                    startGameButton.addEventListener('click', playOnClick);
                    console.log('Audio will attempt to play when "Start Brewing!" is clicked if autoplay failed.');
                }
            });
        }
    }

    // Delay playback by 2 seconds
    setTimeout(playAudioWithHandling, 2000);

    // Mute button functionality
    if (muteButton) {
        muteButton.addEventListener('click', function() {
            isMuted = !isMuted;
            audio.muted = isMuted;
            if (isMuted) {
                muteButton.textContent = 'Unmute';
                muteButton.classList.add('muted');
                console.log('Audio Muted');
            } else {
                muteButton.textContent = 'Mute';
                muteButton.classList.remove('muted');
                console.log('Audio Unmuted');
                // If audio was supposed to be playing but was muted, and now unmuted, try playing it.
                // This handles unmuting if audio hasn't started due to autoplay policy + initial mute.
                if (!audio.playing && audio.readyState >= 2) { // readyState 2 (HAVE_CURRENT_DATA) or higher
                    playAudioWithHandling();
                }
            }
        });
    }
});