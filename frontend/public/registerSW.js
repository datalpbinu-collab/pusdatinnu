if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        }).then(reg => {
            console.log('SW Registered!', reg);
        }).catch(err => {
            console.log('SW Registration Failed!', err);
        });
    });
}