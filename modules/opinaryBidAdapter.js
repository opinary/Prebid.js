import { deepAccess, parseSizesInput } from 'src/utils.js';
import {registerBidder} from '../src/adapters/bidderFactory.js';

export const spec = {
  code: 'opinary',
  /**
   * @param {object} bid
   * @return boolean
   */
  isBidRequestValid: function (bid) {
    if (!deepAccess(bid, 'params.customer')) {
      return false;
    }
    // either sponsored or editorial needs to be allowed
    if (!deepAccess(bid, 'params.sponsored') && !deepAccess(bid, 'params.editorial')) {
      return false;
    }
    let sizes = parseSizesInput(bid.sizes);
    // currently opinary only supports 500x500
    if (sizes.filter(size => size == "500x500").length === 0) {
      return false;
    }
    return true;
  },
  /**
   * @param {BidRequest[]} bidRequests
   * @param bidderRequest
   * @return ServerRequest[]
   */
  buildRequests: (validBidRequests, bidderRequest) => {
    let validBidRequest = validBidRequests.filter(x => x.bidderRequestId === bidderRequest.bidderRequestId);
    if (validBidRequest.length === 0) {
      return {};
    }

    let payload = {};
    payload.customer = validBidRequest[0].params.customer;
    payload.url = bidderRequest.refererInfo.canonicalUrl || bidderRequest.refererInfo.referer;
    payload.requestId = validBidRequest[0].bidId;
    payload.amp = bidderRequest.refererInfo.isAmp;
    payload.adblocker = false;
    if (deepAccess(bidderRequest, 'gdprConsent.gdprApplies')) {
      payload.gdpr = bidderRequest.gdprConsent.gdprApplies;
      payload.gdpr_consent = bidderRequest.gdprConsent.consentString;
    }

    return {
      method: 'GET',
      url: 'https://api.opinary.com/v1/ams/recommendations',
      data: payload
    };
  },
  /**
   * @param {*} responseObj
   * @param {BidRequest} bidRequest
   * @return {Bid[]} An array of bids which
   */
  interpretResponse: function (serverResponse, bidRequest) {
    const body = serverResponse.body;

    // check overall response
    if (body == null || typeof body !== 'object' || !body.hasOwnProperty('pollURL')) {
      return [];
    }

    // TODO: this is what we expect from the API
    let fakeResponse = {
      requestId: bidRequest.data.requestId,
      width: 500,
      height: 500,
      creativeId: 1, // TODO: INTEGER,buyer_creative_id field (64 byte limit)
      cpm: 4.81, // TODO: relevancy based score, see _meta.result.score(float)
      currency: 'USD', // TODO
      isNetRevenue: true, // TODO
      dealId: 0, // TODO
      ttl: 360 // TODO
    };

    // At Opinary we allow publishers to subscribe to voting events
    const msgBridge = `onload="window.addEventListener('message', (event) => {window.parent.postMessage(event.data, '*');});"`;
    
    let adm = `<iframe ${msgBridge} scrolling="no" frameborder="0" width="${fakeResponse.width}" height="${fakeResponse.height}" src="${body.pollURL}"></iframe>`;
    let bid = {
      requestId: fakeResponse.requestId,
      cpm: fakeResponse.cpm,
      width: fakeResponse.width,
      height: fakeResponse.height,
      size: fakeResponse.width + "x" + fakeResponse.height,
      ad: adm,
      ttl: fakeResponse.ttl,
      creativeId: fakeResponse.creativeId, 
      netRevenue: fakeResponse.isNetRevenue,
      currency: fakeResponse.currency,
      dealId: fakeResponse.dealId
    };
    return [bid];
  }
};
registerBidder(spec);
