(() => {
    const teeth = RDC.getBySelectorA('polygon');
    
    teeth.forEach(tooth => {
        console.log(tooth.getAttribute('data-key'));
    });
})();