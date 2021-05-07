const EVENT_URL = 'https://hk4e-api-os.mihoyo.com/common/hk4e_global/announcement/api/getAnnContent?game=hk4e&game_biz=hk4e_global&lang=en&bundle_id=hk4e_global&platform=pc&region=os_usa&level=60'
const CORS_PROXY = "https://jsonp.afeld.me/?url="

// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const LS_ARTICLE_HASHES_NAME = 'articles';
var ARTICLE_HASHES = JSON.parse(localStorage.getItem(LS_ARTICLE_HASHES_NAME) || '{}');

function updateStorage(ann_id, new_hash) {
	ARTICLE_HASHES[ann_id] = new_hash;
	localStorage.setItem(LS_ARTICLE_HASHES_NAME, JSON.stringify(ARTICLE_HASHES));
}

// fetch("test.json")
fetch(CORS_PROXY+encodeURIComponent(EVENT_URL)+'&t='+Math.floor(new Date().getTime()/1000))
.then(res => res.json())
.then(json => {
	if (json.retcode == 0 && json.message == 'OK')
	{
		Array.from(json.data.list).sort((a,b) => b.ann_id-a.ann_id).forEach(article => {
			let wrapper = document.createElement('div');
			let title = document.createElement('div');
			let subtitle = document.createElement('div');
			let banner = document.createElement('img');
			let content = document.createElement('div');
			wrapper.classList.add('_article');
			
			banner.src = article.banner;
			content.appendChild(banner);
			content.innerHTML += article.content.replace(/javascript:miHoYoGameJSSDK\.openIn(?:Webview|Browser)\('([^)]+)'\);/gi,'$1" target="_blank').replace(/&lt;(\/?t(?:| )[^&]*)&gt;/gi,'<$1>');
			
			title.innerHTML = article.title;
			title.classList.add('title');
			title.classList.add('article__title');
			
			wrapper.setAttribute('id',article.ann_id);
			// recreate news site structure so we can just reuse css
			content.classList.add('article__content');
			let body = document.createElement('div');
			body.classList.add('body');
			let cate = document.createElement('div');
			cate.classList.add('article');
			cate.classList.add('cate');
			cate.appendChild(title);
			cate.appendChild(content);
			body.appendChild(cate);
			wrapper.appendChild(body);
			
			
			document.getElementById('right').appendChild(wrapper);
			
			subtitle.innerHTML = article.subtitle;
			subtitle.classList.add('subtitle');
			subtitle.setAttribute('ann_id',article.ann_id);
			let hash = article.content.hashCode();
			subtitle.onclick = ()=> {
				document.getElementsByClassName('_article');
				Array.from(document.getElementsByClassName('_article')).forEach(e=> {e.classList.remove('_selected')});
				document.getElementById(article.ann_id).classList.add('_selected');
				Array.from(document.getElementsByClassName('subtitle')).forEach(e=> {e.classList.remove('_selected')});
				subtitle.classList.add('_selected');
				window.location.hash = article.ann_id;
				updateStorage(article.ann_id, hash);
				subtitle.classList.remove('_unread')
			}
			let badge = document.createElement('span');
			badge.classList.add('badge');
			subtitle.appendChild(badge);
			document.getElementById('left').appendChild(subtitle);

			// set read status from localStorage:
			if (article.ann_id in ARTICLE_HASHES)
				if (hash != ARTICLE_HASHES[article.ann_id]) {
					subtitle.classList.add('_unread')
				}
		});

		// remove stale ann_ids from localStorage
		let current_articles = Array.from(json.data.list).map(e => e.ann_id.toString());
		Object.keys(ARTICLE_HASHES).forEach(ann_id => {
			if (!current_articles.includes(ann_id))
				delete ARTICLE_HASHES[ann_id]
		})

		let first = document.getElementsByClassName('subtitle')[0];
		first.classList.add('_selected');
		document.getElementById(first.getAttribute('ann_id')).classList.add('_selected');
		Array.from(document.getElementsByClassName('subtitle')).forEach(e=> {if (e.getAttribute('ann_id')==window.location.hash.substring(1)) {e.click()}});
		
		// convert all <t> (time) elements to local browser timezone:
		document.querySelectorAll('\\t').forEach(t => {
			let d = new Date(t.innerHTML + "+0800")
			if (t.classList.contains('t_lc')) // local (server) time, t_gl is GMT+0
				d = new Date(t.innerHTML + "-0500")
			let tz_offset = new Date().getTimezoneOffset()
			t.innerHTML = new Date(d - tz_offset * 60000).toISOString().slice(0,-8).replace('T',' ').replace(/-/g,'/');
			let tz_string = ' (UTC';
			if (tz_offset > 0)
				tz_string += '-'
			else
				tz_string += '+'
			tz_string += Math.floor(Math.abs(tz_offset)/60)
			if (Math.abs(tz_offset)%60)
				tz_string += ':' + ("00" + (Math.abs(tz_offset)%60)).slice(-2);
			tz_string += ')';
			t.parentNode.setAttribute('data-timezone',tz_string)
		});
	}
})