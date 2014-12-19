$(function() {

  // This is something that would have to come from the backend, in the PHP
  var jsonObj = {
    "type": "transcode",
    "name": "JW Video test 3",
    "description": "6 second test vid",
    "transcodeProfile": 21,
    "properties": ["tag1", "tags2", "test tag"], //[3, 8, 9, 2, 7],
    "fields": {
      "Description": "Test description",
      "customField": "This is a test value for a custom metadata field",
      "custom 8": "Another custom field bam!"
    },
    "distribution": [
      "name",
      "description",
      "properties",
      "Description",
      "customField",
      "custom 8"
    ]
  },
  metadata = {};

  function metadataMap(value) {
    var dist = jsonObj.distribution.filter(function(d) {
      return d === value;
    });
    return jsonObj[dist];
  }

  document.querySelectorAll('.upload-video-btn')[0].addEventListener('click', function(e) {
    e.preventDefault();

    metadata = {
      snippet: {
        title: metadataMap($('#title').val()),
        description: metadataMap($('#description').val()),
        tags: metadataMap($('#tags').val())
      },
      status: {
        privacyStatus: 'private'
      }
    };

    $.ajax({
      url: '/api/upload_video',
      data: JSON.stringify(metadata),
      type: 'POST'
    }).done(function(resp) {
      console.log(resp);

      $('code').html(resp);
    });
  });

  document.querySelectorAll('.connect-btn')[0].addEventListener('click', function(e) {
    e.preventDefault();

    $.ajax({
      url: '/oauth2callback',
      type: 'POST'
    }).success(function(r) {
      console.log(r);
    });
  });

});
