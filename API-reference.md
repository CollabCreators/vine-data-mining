# Vine.app API Reference

#### [Based on starlock/vino/wiki/API-Reference](https://github.com/starlock/vino/wiki/API-Reference)
> This is just copy for my convenience.

The one and only public documentation of Vine.app 1.0.3

## Common headers

    user-agent: com.vine.iphone/1.0.3 (unknown, iPhone OS 6.1.0, iPhone, Scale/2.000000)
    vine-session-id: <userid>-1231ed86-80a0-4f07-9389-b03199690f73
    accept-language: en, sv, fr, de, ja, nl, it, es, pt, pt-PT, da, fi, nb, ko, zh-Hans, zh-Hant, ru, pl, tr, uk, ar, hr, cs, el, he, ro, sk, th, id, ms, en-GB, ca, hu, vi, en-us;q=0.8

## Get User Data

    GET https://api.vineapp.com/users/profiles/<userid>

### Response

    {
        "code": "",
        "data": {
            "username": "Bill",
            "following": 0,
            "followerCount": 1,
            "verified": 0,
            "description": "Vine.app example account",
            "avatarUrl": "https://vines.s3.amazonaws.com/avatars/123456789.jpg",
            "twitterId": 123456789,
            "userId": 123456789,
            "twitterConnected": 1,
            "likeCount": 0,
            "facebookConnected": 0,
            "postCount": 0,
            "phoneNumber": null,
            "location": "Paris, France",
            "followingCount": 0,
            "email": "xxx@example.com"
        },
        "success": true,
        "error": ""
    }

## Get User Timeline

    GET https://api.vineapp.com/timelines/users/<userid>

### Response

    {
        "code": "",
        "data": {
            "count": 0,
            "records": [],
            "nextPage": null,
            "previousPage": null,
            "size": 20
        },
        "success": true,
        "error": ""
    }

## Get Tag

    GET https://api.vineapp.com/timelines/tags/<tag>
### Parameter
    page=page-id
    GET https://api.vineapp.com/timelines/tags/<tag>?page=page-id
### Response

    {
        "code": "",
        "data": {
            "count": 18,
            "records": [{
                "username": "Alex",
                "videoLowURL": "http://vines.s3.amazonaws.com/videos_500k/4C661F55-7836-439A-9A1C-20D1F7B93A4D-4037-00000258397B6E18_1.0.3. mp4?versionId=gq6LxdxP8okJliUFev5zvETn7Xk7_WAI",
                "liked": false,
                "postToTwitter": 0,
                "videoUrl": "http://vines.s3.amazonaws.com/videos/4C661F55-7836-439A-9A1C-20D1F7B93A4D-4037-00000258397B6E18_1.0.3. mp4?versionId=MQADrr3uVdIuMaPDSn0f2eolBGA2KBCF",
                "description": "My #design project. The theme for my calander is #mustaches #tribalprint #pattern and #handmade",
                "created": "2013-01-29T13:51:02.000000",
                "avatarUrl": "http://vines.s3.amazonaws.com/avatars/4A018ACF-FFDA-4A54-BF11-60ED4B989540-3586-000001A49A3F8A58. jpg?versionId=DIZg6F7hLMsdma1RoqjO6ZVGFs0Ovt8F",
                "userId": 123456789,
                "comments": {
                    "count": 0,
                    "records": [],
                    "nextPage": null,
                    "previousPage": null,
                    "size": 10
                },
                "thumbnailUrl": "http://vines.s3.amazonaws.com/thumbs/4C661F55-7836-439A-9A1C-20D1F7B93A4D-4037-00000258397B6E18_1.0.3.mp4. jpg?versionId=Y1xhPATvT4gdxkeBMBTafWLGpOUaxMDj",
                "foursquareVenueId": null,
                "likes": {
                    "count": 0,
                    "records": [],
                    "nextPage": null,
                    "previousPage": null,
                    "size": 10
                },
                "postToFacebook": 0,
                "promoted": 0,
                "verified": 0,
                "postId": 123456789,
                "explicitContent": 0,
                "tags": [{
                    "tagId": 123456789,
                    "tag": "design"
                }, {
                    "tagId": 123456789,
                    "tag": "handmade"
                }],
                "location": null
            }],
            "nextPage": null,
            "previousPage": null,
            "size": 20
        },
        "success": true,
        "error": ""
    }

## Get Single Post

    GET https://api.vineapp.com/timelines/posts/<postid>

### Response

    {
        "code": "",
        "data": {
            "count": 0,
            "records": [],
            "nextPage": null,
            "previousPage": null,
            "size": 20
        },
        "success": true,
        "error": ""
    }

## Get Single Vine Post

    GET https://api.vineapp.com/timelines/posts/s/<postid>

## Response

    {
        "code": "",
        "data": {
            "count": 1,
            "anchorStr": "0",
            "records": [
                {
                    "liked": 0,
                    "videoDashUrl": "http://v.cdn.vine.co/r/videos_h264dash/DE5F97E6191165534338289745920_362b7235f57.1.1.4644296068990602924.mp4?versionId=qlBvRIc8VYbjTfsTZVz21uVwlshpL9KY",
                    "foursquareVenueId": null,
                    "userId": 926567067996524544,
                    "private": 0,
                    "likes": {
                        "count": 2,
                        "anchorStr": "1165535178341367808",
                        "records": [
                            {
                                "username": "Brian Conoscenti",
                                "verified": 0,
                                "vanityUrls": [],
                                "created": "2015-01-10T03:10:55.000000",
                                "userId": 1001582288498262016,
                                "user": {
                                    "private": 0
                                },
                                "likeId": 1165535178341367808
                            },
                            {
                                "username": "Samberly Stamp",
                                "verified": 0,
                                "vanityUrls": [],
                                "created": "2015-01-10T13:37:08.000000",
                                "userId": 932765478974275584,
                                "user": {
                                    "private": 0
                                },
                                "likeId": 1165692774436528128
                            }
                        ],
                        "nextPage": null,
                        "backAnchor": "",
                        "anchor": 1165535178341367808,
                        "previousPage": null,
                        "size": 10
                    },
                    "loops": {
                        "count": 1609.0,
                        "velocity": 0.0,
                        "onFire": 0
                    },
                    "thumbnailUrl": "http://v.cdn.vine.co/r/videos/DE5F97E6191165534338289745920_362b7235f57.1.1.4644296068990602924.mp4.jpg?versionId=w7tXUbUP44A9DjfT.Ti5DgzQFf3kh88J",
                    "explicitContent": 0,
                    "blocked": 0,
                    "verified": 0,
                    "avatarUrl": "http://v.cdn.vine.co/r/avatars/8F76EF105E1123334806810599424_24802c81665.1.0.jpg?versionId=AUCZ4wGBDeCc.kfuTxo3CVd44sMg.S1R",
                    "comments": {
                        "count": 0,
                        "anchorStr": null,
                        "records": [],
                        "nextPage": null,
                        "backAnchor": "",
                        "anchor": null,
                        "previousPage": null,
                        "size": 10
                    },
                    "entities": [],
                    "videoLowURL": "http://v.cdn.vine.co/r/videos_r2/DE5F97E6191165534338289745920_362b7235f57.1.1.4644296068990602924.mp4?versionId=t7h5MrMtfVhLzYUp0ow2oetFWASUvnaZ",
                    "vanityUrls": [],
                    "username": "Carson Cunningham",
                    "description": "Trevor Booker. I still can't get over this shot. Replay:",
                    "tags": [],
                    "permalinkUrl": "https://vine.co/v/OpUIQmQYuQm",
                    "promoted": 0,
                    "postId": 1165534353162461184,
                    "profileBackground": "0x5082e5",
                    "videoUrl": "http://mtc.cdn.vine.co/r/videos/DE5F97E6191165534338289745920_362b7235f57.1.1.4644296068990602924.mp4?versionId=7XR5VVi9Z45yaXXNcpqQ19NSMaETfHY8",
                    "followRequested": 0,
                    "created": "2015-01-10T03:07:38.000000",
                    "shareUrl": "https://vine.co/v/OpUIQmQYuQm",
                    "myRepostId": 0,
                    "following": 0,
                    "reposts": {
                        "count": 1,
                        "anchorStr": "1165535189410492416",
                        "records": [],
                        "nextPage": null,
                        "backAnchor": "",
                        "anchor": 1165535189410492416,
                        "previousPage": null,
                        "size": 10
                    }
                }
            ],
            "nextPage": null,
            "backAnchor": "",
            "anchor": 0,
            "previousPage": null,
            "size": 20
        },
        "success": true,
        "error": ""
    }
