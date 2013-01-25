/*global afterEach, beforeEach, describe, expect, it, jasmine, jQuery, sinon, spyOn, MM*/
describe('activity log', function () {
	'use strict';
	var activityLog, clock, analytic;
	beforeEach(function () {
		analytic = jasmine.createSpy();
		activityLog = new MM.ActivityLog(2, analytic);
		clock = sinon.useFakeTimers();
	});
	afterEach(function () {
		clock.restore();
	});
	it('should be created', function () {
		expect(activityLog).toBeDefined();
	});
	it('should be able to log activity', function () {
		activityLog.log('Hello', 'World');

		expect(activityLog.getLog()).toEqual([{
			id: 1,
			ts: new Date(),
			event: 'Hello,World'
		}]);
	});
	it('should send analytics when log method invoked', function () {
		activityLog.log('category', 'event type', 'label');

		expect(analytic).toHaveBeenCalledWith(['_trackEvent', 'category', 'event type', 'label']);
	});
	it('should always send analytics as a 1 depth array', function () {
		activityLog.log(['category', 'event type', 'label']);

		expect(analytic).toHaveBeenCalledWith(['_trackEvent', 'category', 'event type', 'label']);
	});
	it('should not exceed maximum event size', function () {
		activityLog.log('foo');
		activityLog.log('bar');
		activityLog.log('baz');

		expect(activityLog.getLog()).toEqual([{
			id: 2,
			ts: new Date(),
			event: 'bar'
		}, {
			id: 3,
			ts: new Date(),
			event: 'baz'
		}]);
	});
});
describe('tracking widget', function () {
	'use strict';
	var element, activityLog;
	beforeEach(function () {
		activityLog = new MM.ActivityLog(10, jQuery.noop);
		element = jQuery('<input type="button" data-category="Feedback" data-event-type="Open" data-label="topmenubar"></input>').appendTo('body');
	});
	it('should be used as a jquery plugin', function () {
		var result = element.trackingWidget(activityLog);

		expect(result).toBe(element);
	});
	it('should invoke log method on activityLog and pass in category, eventType and label as parameters', function () {
		spyOn(activityLog, 'log');
		element.trackingWidget(activityLog);

		element.click();

		expect(activityLog.log).toHaveBeenCalledWith('Feedback', 'Open', 'topmenubar');
	});
	it('should send empty strings for missing attributes', function () {
		element = jQuery('<input type="button" data-category="Feedback"></input>').appendTo('body');
		spyOn(activityLog, 'log');
		element.trackingWidget(activityLog);

		element.click();

		expect(activityLog.log).toHaveBeenCalledWith('Feedback', '', '');
	});
});