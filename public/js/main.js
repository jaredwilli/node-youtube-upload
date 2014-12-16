$(function() {

  // This is something that would have to come from the backend, in the PHP
  var jsonObj = {
    "type": "transcode",
    "name": "JW Video test 3",
    "description": "6 second test vid",
    "transcodeProfile": 21,
    "properties": ['tag1', 'tags2', 'test tag'], //[3, 8, 9, 2, 7],
    "fields": {
      "Description": "Test description",
      "customField": "This is a test value for a custom metadata field",
      "custom 8": "Another custom field bam!"
    }
  };

  var metadata = {};

  function metadataMap(value) {
    return jsonObj[value];
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
    });
  });
});
