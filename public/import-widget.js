/*global $, content, MM, window*/
$.fn.importWidget = function (activityLog, mapRepository) {
	'use strict';
	var element = this,
		uploadType,
		statusDiv = element.find('[data-mm-role=status]'),
		fileInput = element.find('input[type=file]'),
		selectButton = element.find('[data-mm-role=select-file]'),
		spinner = function (text) {
			statusDiv.html("<i class='icon-spinner icon-spin'/> " + text);
		},
		start = function (filename) {
			activityLog.log('Map', 'import:start ' + uploadType, filename);
			spinner("Uploading " + filename);
		},
		parseFile = function (file_content, type) {
			var counter = 0,
				expected;
			if (type === 'mm') {
				return MM.freemindImport(file_content,
					function (total) {  expected = total; },
					function () {
						var pct = (100 * counter / expected).toFixed(2) + "%";
						if (counter % 1000 === 0) {
							spinner("Converted " + pct);
						}
						counter++;
					});
			}
			if (type === 'mup') {
				return JSON.parse(file_content);
			}
		},
		fail = function (error, detail) {
			activityLog.log('Map', 'import:fail', error);
			statusDiv.html(
				'<div class="alert fade in alert-error">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + error + '</strong>' +
					'</div>'
			);
		},
		success = function (file_content, type) {
			var idea, json_content, counter;
			spinner("Processing file");
			if (type !== 'mup' && type !== 'mm') {
				fail('unsupported format ' + type);
			}
			try {
				json_content = parseFile(file_content, type);
			} catch (e) {
				fail('invalid file content', e);
				return;
			}
			spinner("Initialising map");
			counter = 0;
			idea = content(json_content, function () {
				if (counter % 1000 === 0) {
					spinner("Initialised " + counter + " nodes");
				}
				counter++;
			});
			spinner("Done");
			activityLog.log('Map', 'import:complete');
			statusDiv.empty();
			element.modal('hide');
			mapRepository.setMap(idea);
		},
		shouldUseFileReader = function () {
			return (window.File && window.FileReader && window.FileList && window.Blob && (!$('body').hasClass('disable-filereader')));
		};
	if (shouldUseFileReader()) {
		fileInput.file_reader_upload(start, success, fail);
		uploadType = 'FileReader';
	} else {
		fileInput.background_upload('/import', start, success, fail);
		uploadType = 'Remote Upload';
	}
	element.on('shown', function () {
		fileInput.css('opacity', 0).css('position', 'absolute').offset(selectButton.offset()).width(selectButton.outerWidth())
			.height(selectButton.outerHeight());
	});
	return element;
}
