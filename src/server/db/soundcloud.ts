import Soundcloud from "soundcloud.ts";
import axios from 'axios';

const apiKey = '0K8gqs6E9DAVUafZxVq6xIIVVjtIgXTv';
const token = '2-293786-2638755-gWxAG2By24REBSKP';
const api2URL = "https://api-v2.soundcloud.com/"
const soundcloud = new Soundcloud(apiKey, token);
const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36", "accept": "application/json; charset=utf-8" }// "Content-Type": "application/json"}

export async function createChronologicalSoundcloudPlaylists() {
    
    const likesResponse1 = await soundcloud.api.getV2('/users/2638755/likes', {linked_partitioning: 1, limit: 1000});
    const likesResponse2 = await soundcloud.api.getV2('/users/2638755/likes?offset=2017-09-29T22%3A25%3A28.409Z%2Cuser-track-likes%2C429-00000000000002638755-00000000000344591012&limit=1000');
    const likesResponse =  [...likesResponse1.collection, ...likesResponse2.collection]
    const likes =  Object.keys(likesResponse).map((key: any) => ({...likesResponse[key],key:key})).sort().reverse().filter(like => {return like.track != undefined});

    for (let year = 2015; year <= 2023; year++) {
        const likesByYear = likes.filter(like => {
            return like.created_at.startsWith(year.toString()) 
        }
        )
        const tracks = likesByYear.filter(like => {
            return like.track.duration < 900000
        }).map(track => track.track.id);

        const sets = likesByYear.filter(like => {
            return like.track.duration > 900000
        }).map(set => set.track.id);
        const tracksResponse = await post("/playlists", await createPlaylist('liked-tracks-' + year.toString(), tracks));
        const setsResponse = await post("/playlists", await createPlaylist('liked-sets-' + year.toString(), sets));

    }
    
}

const createPlaylist = async (title: string, tracks: any[]) => {
    return { 
        playlist: {
            title: title,
            sharing: 'public',
            tracks: tracks
        },
        function(playlist: any) { return console.log(playlist)}
    }
        
}

const updatePlaylist = async (tracks: number[]) => {
    return {
        playlist: {
            tracks: tracks
        }
    }
}

const post = async (endpoint: string, data: any, put?: boolean, params?: any) => {
    if (!params) {
        params = {}
    }
    params.client_id = await soundcloud.api.getClientID()
    if (soundcloud.api.oauthToken) {
        params.oauth_token = soundcloud.api.oauthToken
    }
    if (endpoint.startsWith("/")) {
        endpoint = endpoint.slice(1) 
    }
    endpoint = api2URL + endpoint;
    if (soundcloud.api.proxy) { 
        endpoint = soundcloud.api.proxy + endpoint
    }
    if (put) {
        return await axios.put(endpoint, data, {params, headers: headers}).then((r) => r.data)
    }
    return await axios.post(endpoint, data, {params, headers: headers}).then((r) => r.data)
}
