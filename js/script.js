//create the google maps object
var Map = function (element, opts) {
    this.gMap = new google.maps.Map(element, opts);
    //this.markerCluster = new MarkerClusterer(this.gMap, []); --- disabled due to issues adapting the functionality to this app.
    //use the zoom method to get and set the zoom level, if no value is supplied the current zoom level will be returned.
    this.zoom = function (level) {
        if (level) {
            this.gMap.setZoom(level);
        } else {
            return this.gMap.getZoom();
        }
    };
};
//map options object to be supplied when creating a new Map
var mapOptions = {
    center: {
        lat: 37.791359,
        lng: -122.435883
    },
    zoom: 8,
    disableDefaultUI: false,
    scrollwheel: true,
    draggable: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    // maxZoom: ,
    // minZoom: ,
    zoomControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT,
        style: google.maps.ZoomControlStyle.SMALL
    },
    panControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT
    }
};
var element = document.getElementById('map-canvas'),
    iconSelected = './images/gMapPin.png';
var map = new Map(element, mapOptions);
map.zoom(15);

//initialize infoBubble library. Adds tabs tot he info bubbles on the markers
var infoBubble = new InfoBubble({
    maxWidth: 300,
    maxHeight: 200,
    closeSrc: './images/close.png',
    backgroundClassName: 'infoBubble'
    /*closeAll: function() {
        for(var i = infoBubble.tabs_.length; i--; ){
            infoBubble.removeTab(i);
        }
    }*/
});

infoBubble.addTab('NYtimes','cool content is coming');
infoBubble.addTab('Wiki','cool content is coming');
infoBubble.addTab('streetView','cool content is coming');

//data
var places = [
    {
        id: 1,
        name: 'Roman Forum',
        map: map.gMap,
        position: {
            lat: 41.892432787816716,
            lng: 12.485354968200681
        },
        icon: null,
        animation: google.maps.Animation.DROP,
        selected: 0
    },{
        id: 2,
        name: 'Flavian Amphitheatre',
        map: map.gMap,
        position: {
            lat: 41.88996,
            lng: 12.49419
        },
        icon: null,
        animation: google.maps.Animation.DROP,
        selected: 0
    },{
        id: 3,
        name: 'Altar of the Fatherland',
        map: map.gMap,
        position: {
            lat: 41.89669,
            lng: 12.48197
        },
        icon: null,
        animation: google.maps.Animation.DROP,
        selected: 0
    },{
        id: 4,
        name: 'Basilica di San Pietro in Vincoli',
        map: map.gMap,
        position: {
            lat: 41.89377451291434,
            lng: 12.49312264550781
        },
        icon: null,
        animation: google.maps.Animation.DROP,
        selected: 0
    },{
        id: 5,
        name: 'St Clemens Basilica',
        map: map.gMap,
        position: {
            lat: 41.889365881757946,
            lng: 12.497542925964353
        },
        icon: null,
        animation: google.maps.Animation.DROP,
        selected: 0
    }
];

//create marker
var Place = function(place) {
    place.name = ko.observable(place.name);
    place.selected = ko.observable(place.selected);
    var marker = new google.maps.Marker(place);
    if (map.markerCluster) {
        map.markerCluster.addMarker(marker);
    }
    return marker;
};

//octopus
var ViewModel = function(){
    var self = this;
    this.list = ko.observableArray([]);

    //create and bind our markers from our raw data
    places.forEach(function(place){
        var marker = new Place(place);
        //add event listener using a closure.
        google.maps.event.addListener(marker, 'click', (function(Copy) {
            return function() {
                self.setCurrentPlace(Copy);
            };
        })(marker));

        self.list().push(marker);
    });
    //ajax calls
    this.ajaxCallNY = function(data) {

        var contentString;
        var nyTimes = "http://api.nytimes.com/svc/search/v2/articlesearch.json?q=" + data.name() + "&page=0&fl=headline,snippet&api-key=d46598ba9b6ede96c3e0e686577e14d2:19:72046219";
        $.getJSON(nyTimes, function (data) {

            var items = [];
            $.each(data.response.docs, function (idx, obj) {
                items.push("<h4>" + idx + " - " + obj.headline.main + "</h4>");
                items.push("<p>" + obj.snippet + "</p>");
            });

            contentString = items.join("");

            infoBubble.updateTab(0,'<div class="infoBubble">NYtimes</div>',contentString);
            infoBubble.updateContent_();
        }).error(function(e){
            var error = "<p>error: failed to load articles from NYTimes. Here is the actual error...</p>" + e.statusText;
            infoBubble.updateTab(0,'<div class="infoBubble">NYtimes</div>',error);
            infoBubble.updateContent_();
        });
    };
    this.wikiCall = function(data){

        var wikiTimeOut = setTimeout(function(){
            infoBubble.updateTab(1, '<div class="infoBubble">Wiki</div>', "request failed");
            infoBubble.updateContent_();
        }, 4000);
        $.ajax({
            url: "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&limit=10&search="+data.name(),
            type: 'POST',
            dataType: "jsonp",
            success: function( response ) {
                var articleTitle = response[1];
                var articleLink = response[3];
                var result = [];
                for (var i = 0; i < articleTitle.length; i++){
                    var title = articleTitle[i];
                    var link = articleLink[i];
                    result.push('<li><a href="'+link+'"target="_blank">'+title+'</a></li>');
                }
                var contentString = result.join('');
                clearTimeout(wikiTimeOut);
                infoBubble.updateTab(1,'<div class="infoBubble">Wiki</div>',contentString);
                infoBubble.updateContent_();
            }
        });
    };
    this.streetView = function(data){

        var img = data.position.A + "," + data.position.F;
        var contentString = '<img class="bgimg" alt="failed to load image...check internet" src="https://maps.googleapis.com/maps/api/streetview?size=600x300&location='+img+'">';
        infoBubble.updateTab(2,'<div class="infoBubble">streetView</div>',contentString);
        infoBubble.updateContent_();
    };
    this.setCurrentPlace = function(data){

        self.list().forEach(function(data){
            data.setIcon(null);
            data.selected(null);
        });
        data.setIcon(iconSelected);
        data.selected(1);
        self.currentPlace(data);
        self.ajaxCallNY(data);
        self.wikiCall(data);
        self.streetView(data);
        infoBubble.open(map.gMap, data);
        return true;
    };
    this.currentPlace = ko.observable( this.list()[0] );
    this.searchBox = ko.observable("");
    //use ko utils arrayFilter to filter the array of markers to implement the search functionality
    this.searchPlaces = ko.computed(function() {
            if(self.searchBox() === "") {
                return self.list();
            } else {
                return ko.utils.arrayFilter(self.list(), function(item) {
                    return item.name().toLowerCase().indexOf(self.searchBox().toLowerCase())>-1;
                });
            }
        });
    $( "#placesBtn" ).click(function() {
        $( "#places" ).toggleClass( "hidden-xs" );
    });
    window.onload=this.setCurrentPlace(this.list()[0]);
};
ko.applyBindings(new ViewModel());
