$(document).ready(function() {
    // console.log("Accessibility Rocks!");

    document.addEventListener('keydown', function(e) {
        // console.log(e.code);
        e.preventDefault();
        if (e.code == '' || e.code == 'unidentified' || e.code == 'Space') {
            // highlight and speak
            // console.log("space pressed\n")
            $("*:not(body)").hover( 
                function (ev) {
                    console.log(ev)
                    // console.log("hovering")
                    //EXECUTED WHEN MOUSE ENTERS AN ELEMEN
                    $(this).addClass("highlight");

                    let text_to_speak = '';
                    let tagname = this.tagName;
                    if (tagname == 'IMG') {
                        let alttext = $(this).attr('alt');
                        let scrofimg = $(this).attr('src');

                        if ($(this).attr('alt')) {
                            text_to_speak = alttext;
                        }
                        else {
                            text_to_speak = scrofimg;
                        }
                    }
                    else {
                        text_to_speak = $(this).text();
                    }
                    speechSynthesis.speak(new SpeechSynthesisUtterance(text_to_speak));
                    ev.stopPropagation();
                }, 
                
                function (ev) {
                    // console.log("not hovering")
                    //EXECUTED WHEN MOUSE EXITS AN ELEMENT
                    $(".highlight").removeClass("highlight");
                    speechSynthesis.cancel();
                }
            )
        }
        else {
            // remove highlight and stop speaking
            // console.log("not space pressed\n")
            $("*:not(body)").hover(
                function () {
                    $(".highlight").removeClass("highlight");
                    speechSynthesis.cancel();
                }
            )
        }
    })
    
});