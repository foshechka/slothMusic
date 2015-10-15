// @codekit-prepend "openapi.js"
// @codekit-prepend "../bower_components/jquery/dist/jquery.min.js"
// @codekit-prepend "../bower_components/boostrap-sass/assets/javascripts/bootstrap/dropdown.js"
// @codekit-prepend "../bower_components/sortable.js/Sortable.min.js"

;(function($) {

	/*
	//	id приложения и права
	*/
	var app = {
		id: 5083406,
		permissions: 8 | 1024,
	}

	/*
	//	обьявление глобальных переменных
	*/
	var slothMusic;
	var authButton = document.getElementById("authButton");
	var player = document.getElementById("player");
	var playlist = document.getElementById("playlist");
	var loading = document.getElementById("loading");

	var content = {
		player: document.getElementsByClassName("player"),
		audio: document.getElementsByClassName("audio"),
		playlist: document.getElementsByClassName("playlist"),
		authButton: document.getElementsByClassName("authButton")
	};

	var controls = {
		user: {
			avatar: document.getElementById("avatar"),
			avatar_bg: document.getElementById("avatar_bg"),
			name: document.getElementById("name"),
		},
		player: {
			title: document.getElementById("title"),
			prev: document.getElementById("prev"),
			next: document.getElementById("next"),
		},
		audio: {
			add: document.getElementsByClassName("add"),
			delete: document.getElementsByClassName("delete"),
			shuffle: document.getElementById("shuffle"),
			alphabetically: document.getElementById("alphabetically"),
			my: document.getElementById("my"),
			popular: document.getElementById("popular"),
			recommendations: document.getElementById("recommendations"),
			backward: document.getElementById("backward"),
			forward: document.getElementById("forward"),
			download: document.getElementById("download"),
			downloadAll: document.getElementById("downloadAll"),
			m3u: document.getElementById("m3u"),
			broadcast: document.getElementById("broadcast"),
			send: {
				form: document.getElementById("audioSendForm"),
				file: document.getElementById("audioSendFile"),
			},
		},
		search: {
			form: document.getElementById("search"),
			query: document.getElementById("query"),
		},
		genres: {
			btn: document.getElementById("genresBtn"),
			text: document.getElementById("genresText"),
			list: document.getElementById("genresList"),
		}
	}

	/*
	// uid: id пользователя
	// sid: id сессии
	// playlist: текущий плейлист
	// player: плеер
	// device: устройство
	// mode: режим работы
	// downloading: список заугружаемых аудиозаписей
	*/
	var session = {
		uid: null,
		sid: null,
		sortable: true,
		playlist: new Array(),
		player: {
			/*
			// status: состояние плеера
			// playing: данные текущей аудиозаписи
			*/
			status: true,
			playing: {
				/*
				// index: индекс аудиозаписи в плейлисте
				// title: полное название аудиозаписи
				// url: адрес к mp3
				*/
				index: 0,
				title: null,
				url: null
			},
		},
		device: null,
		mode: "listening",
		downloading: new Array(),
		request: new Object(),
		requesting: false,
		broadcast: false,
	};

	/*
	// если используют моб. устройства
	*/
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		session.device = "mobile";
	} else {
		session.device = "desktop";
	}

	/*
	//	drag and drop в плейлисте (только desktop)
	*/
	if (session.device == "desktop") {
		var sortable = new Sortable(playlist, {
			animation: 250,
			onEnd: function(e) { // после перетаскивания
				if (session.sortable == true) {
					var el = e.item;
					var prev = $(el).prev();
					var next = $(el).next();

					if ($(prev).index() < 0 && $(next).index() >= 0) // начало плейлиста
						slothMusic.audio.reorder($(el).data("id"), $(next).data("id"), "");
					else if ($(prev).index() >= 0 && $(next).index() >= 0) // середина плейлиста
						slothMusic.audio.reorder($(el).data("id"), "", $(prev).data("id"));
					else if ($(prev).index() > 0 && $(next).index() < 0) // конец плейлиста
						slothMusic.audio.reorder($(el).data("id"), "", $(prev).data("id"));

					if ($(el).hasClass("active"))
						session.player.playing.index = $(el).index();

					slothMusic.animation.playlist.moved(el);
				}
			},
		});
	}

	/*
	//	если возникает проблема с типом
	*/
	if (typeof slothMusic === "undefined") slothMusic = {};

	slothMusic = {
		init: function() {
			this.vk.init();
			this.player.init();
			this.audio.init();
		},
		vk: {
			/*
			// this.vk.init(); // инициализация Open API от VK
			// this.vk.auth(); // действия при попытке авторизации
			// this.vk.button; // кнопка авторизации
			*/
			init: function() {
				VK.init({
					apiId: app.id
				});
				VK.Auth.getLoginStatus(slothMusic.vk.auth);
				VK.UI.button("authButton");

				slothMusic.vk.button.ready();
			},
			auth: function(response) {
				if (response.session) {
					// console.log("VK Auth: success");

					if (response.status === "connected") {
						session.uid = response.session.mid;
						session.sid = response.session.sid;

						slothMusic.vk.button.hide();
						slothMusic.content.show();
						slothMusic.audio.setBroadcast(0, session.uid);
						slothMusic.audio.get(session.uid, 0);
					}
				} else {
					// console.log("VK Auth: fail");
					slothMusic.content.hide();
					slothMusic.vk.button.show();
				}
			},
			button: {
				/*
				// this.vk.button.show(); // показать кнопку авторизации
				// this.vk.button.hide(); // спрятать кнопку авторизации
				// this.vk.button.ready(); // действия на странице
				*/
				hide: function() {
					$(content.authButton).fadeOut(250).addClass("not_authorized");
				},
				show: function() {
					$(content.authButton).fadeIn(250).removeClass("not_authorized");
				},
				ready: function() {
					$(authButton).on("click", function() {
						VK.Auth.login(slothMusic.vk.auth, app.permissions);
					});
				}
			},
		},

		document: {
			/*
			// this.document.title(title); // присвоить заголовок странице
			// this.document.loading; // загрузка контента на странице
			*/
			title: function(title) {
				$(document).prop("title", title);
			},
			loading: {
				/*
				// this.document.loading.show(); // показать загрузку контента
				// this.document.loading.hide(); // спрятать загрузку контента
				 */
				show: function() {
					$(loading).show(100);
				},
				hide: function() {
					$(loading).hide(100);
				},
			},
		},

		content: {
			/*
			// this.content.show(); // показать контент на странице
			// this.content.hide(); // спрятать контент на странице
			*/
			show: function() {
				$(content.player).fadeIn(1000).removeClass("not_authorized");
				$(content.audio).fadeIn(1000).removeClass("not_authorized");
				$(content.playlist).fadeIn(1000).removeClass("not_authorized");
			},
			hide: function() {
				$(content.player).fadeOut(1000).addClass("not_authorized");
				$(content.audio).fadeOut(1000).addClass("not_authorized");
				$(content.playlist).fadeOut(1000).addClass("not_authorized");
			}
		},

		player: {
			/*
			// this.player.init(); // инициализация плеера и плейлиста
			// this.player.src(src); // указать путь для плеера
			// this.player.play(item); // воспроизвести песню из атрибута data("url")
			// this.player.controls; // контролы плеера
			*/
			init: function() {
				slothMusic.player.controls.ready();
				slothMusic.player.playlist.ready();

				player.addEventListener("ended", function() {
					slothMusic.player.controls.next();
				}); // окончание проигрывания

				player.addEventListener("pause", function() {
					if (player.src) {
						slothMusic.animation.player.prev();
						slothMusic.document.title("Пауза: " + session.player.playing.title);
					}
				}); // пауза

				player.addEventListener("play", function() {
					if (player.src) {
						slothMusic.animation.player.next();
						slothMusic.document.title(session.player.playing.title);
					}
				}); // воспроизведение

				player.addEventListener("waiting", function() {
					if (player.src) {
						slothMusic.document.loading.show();
						slothMusic.document.title("Загрузка: " + session.player.playing.title);
					}
				}); // буферизация

				player.addEventListener("playing", function() {
					if (player.src) {
						slothMusic.document.loading.hide();
						slothMusic.document.title(session.player.playing.title);
					}
				}); // проигрывание
			},
			src: function(src) {
				player.src = src;
			},

			play: function(item) {
				session.player.status = true;
				var song = session.playlist[item.data("id")];

				session.player.playing.index = item.index();
				session.player.playing.title = song.song;
				session.player.playing.url = song.url;

				player.src = session.player.playing.url;
				player.load();
				player.play();

				if (session.broadcast)
					slothMusic.audio.setBroadcast(song.owner_id + "_" + song.id, session.uid);
				else
					slothMusic.audio.setBroadcast(0, session.uid);

				$(controls.player.title).text(session.player.playing.title);
				$(playlist).children().removeClass("active");
				item.addClass("active");
			},
			controls: {
				/*
				// this.player.controls.play(); // воспроизвести
				// this.player.controls.pause(); // пауза
				// this.player.controls.prev(); // предыдущая песня
				// this.player.controls.next(); // следующая песня
				// this.player.controls.rewinding; // перемотка аудиозаписи
				// this.player.controls.ready(); // действия на странице
				*/
				play: function() {
					session.player.status = true;
					player.play();
				},
				pause: function() {
					session.player.status = false;
					player.pause();
				},
				prev: function() {
					slothMusic.animation.player.prev();

					if ($(playlist).find("a:first-child").hasClass("active"))
						var el = $(playlist).find("a:last-child");
					else
						var el = $(playlist).find("a").eq(session.player.playing.index - 1);

					slothMusic.player.play(el);
					slothMusic.player.playlist.bitrate(session.uid, el);
				},
				next: function() {
					slothMusic.animation.player.next();

					if ($(playlist).find("a:last-child").hasClass("active"))
						var el = $(playlist).find("a:first-child");
					else
						var el = $(playlist).find("a").eq(session.player.playing.index + 1);

					slothMusic.player.play(el);
					slothMusic.player.playlist.bitrate(session.uid, el);
				},
				rewinding: {
					/*
					// this.player.controls.rewinding.backward(); // перемотка назад (на 10 сек)
					// this.player.controls.rewinding.forward(); // перемотка вперед (на 10 сек)
					*/
					backward: function() {
						player.currentTime -= 10;
					},
					forward: function() {
						player.currentTime += 10;
					},
				},
				ready: function() {
					$(controls.player.prev).on("click", function() {
						slothMusic.player.controls.prev();
					});
					$(controls.player.next).on("click", function() {
						slothMusic.player.controls.next();
					});
					$(controls.audio.backward).on("click", function() {
						slothMusic.player.controls.rewinding.backward();
					});
					$(controls.audio.forward).on("click", function() {
						slothMusic.player.controls.rewinding.forward();
					});
				}
			},
			playlist: {
				/*
				// this.player.playlist.add(response); // добавить песни из запроса в плейлист
				// this.player.playlist.shuffle(); // перемешать плейлист
				// this.player.playlist.alphabetically(); // сортировка плейлиста по алфавиту
				// this.player.playlist.empty(); // очистить плейлист
				// this.player.playlist.bitrate(uid, el); // получить битрейт аудиозаписи
				// this.player.playlist.download(items); // загрузить аудиозаписи
				// this.player.playlist.generator; // генератор плейлистов
				// this.player.playlist.ready(); // действия на странице
				*/
				add: function(response) {
					var items, count;

					// если в ответе обьекты находятся в items
					if (response.items)
						items = response.items;
					else
						items = response;

					// создание элементов в плейлисте
					$(items).each(function(i, item) {
						session.playlist[item.id] = { // (item.url.replace("https", "http")).replace(/\?extra=(.*)/, "")
							url: item.url,
							song: item.artist + " — " + item.title,
							duration: item.duration,
							owner_id: item.owner_id,
							artist: item.artist,
							title: item.title,
							id: item.id
						}

						$("<a/>", {
							"data-id": item.id,
							"class": "playlist-item",
							"text": $.trim(item.artist + " — " + item.title)
						}).appendTo(playlist);
					});

					// slothMusic.player.play($(playlist).find("a").eq(0)); // воспроизводить первую аудиозапись

					// убираем возможность добавления или удаления аудиозаписей, если используют моб. устройства
					if (session.device == "desktop") {
						VK.Api.call("audio.get", {
							count: 6000,
							v: 5.37
						}, function(r) {
							if (r.response) {
								var users_audio = r.response.items; // массив аудиозаписей пользователя
								var users_audio_ids = []; // id-шники аудиозаписей пользователя

								$(users_audio).each(function(i, item) {
									users_audio_ids[i] = item.id;
								});

								// создание элементов добавления или удаления аудизаписи
								// если аудозапись есть у пользователя, создается элемент удаления
								// если нет, тогда добавления
								$(playlist).find("a").each(function(i, item) {
									if (!$(this).find("div").hasClass("player-controls-actions")) {
										$("<div/>", {
											"class": "player-controls-actions"
										}).appendTo(this);

										$("<small/>", {
											"class": ""
										}).appendTo($(this).find("div"));

										if ($.inArray($(item).data("id"), users_audio_ids) >= 0) {
											$("<span/>", {
												"class": "delete"
											}).appendTo($(this).find("div"));
										} else {
											$("<span/>", {
												"class": "add"
											}).appendTo($(this).find("div"));
										}
									}
								});
							}
						});
					}
				},
				shuffle: function() {
					$(playlist).find("a").shuffle();
				},
				alphabetically: function() {
					$(playlist).alphabetically();
				},
				alphabeticallyReverse: function() {
					$(playlist).alphabeticallyReverse();
				},
				empty: function() {
					$(playlist).empty();
				},
				bitrate: function(uid, el) {
					var id = $(el).data("id");
					var item = session.playlist[$(el).data("id")];

					if (access_token !== "undefined") {
						$.ajax({
							url: "fileinfo",
							data: {
								id: id,
								duration: item.duration,
								owner_id: item.owner_id,
								access_token: access_token,
								uid: uid
							},
							method: "POST",
							dataType: "json",
							success: function(data) {
								if (parseInt(data.kbps) > 0) { // если битрейт известен
									if (data.kbps >= 320)
										var kbpsClass = "bitrate-higher";
									else if (data.kbps >= 256 && data.kbps < 320)
										var kbpsClass = "bitrate-high";
									else if (data.kbps >= 192 && data.kbps < 256)
										var kbpsClass = "bitrate-medium";
									else if (data.kbps < 192)
										var kbpsClass = "bitrate-low";

									$(el).find("div > small").addClass("bitrate " + kbpsClass).text(data.kbps);
								}
							}
						});
					}
				},
				download: function(items) {
					if (access_token !== "undefined") {
						$("<div/>", {
							"id": "downloading",
							"class": "hide"
						}).appendTo("body");

						$(items).each(function(i, item) {
							$("<a/>", {
								"href": "download?o=" + item.owner_id + "&i=" + item.id + "&a=" + item.artist + "&t=" + item.title,
								"class": "hide",
								"target": "_blank"
							}).appendTo("#downloading");
						});

						if ($("#downloading").find("a").each(function(i, item) {
								$(item)[0].click();
							})) {
							session.downloading = [];
							$("#downloading").remove();
						}
					}
				},
				generator: {
					/*
					// this.player.playlist.generator.m3u(); // сгенерировать m3u плейлист
					 */
					m3u: function() {
						var m3u = "#EXTM3U\r\n";
						$(playlist).find("a").each(function(i, item) {
							song = session.playlist[$(item).data("id")];
							m3u += "#EXTINF:" + song.duration + "," + (song.artist).replace(/\r\n|\r|\n/g, " ") + " - " + (song.title).replace(/\r\n|\r|\n/g, " ") + "\r\n";
							m3u += (song.url.replace("https", "http")).replace(/\?extra=(.*)/, "") + "\r\n";
						});

						var file = new Blob([m3u], {
							type: "audio/x-mpegurl"
						});
						var url = window.URL.createObjectURL(file);

						$("<a/>", {
							"id": "m3uPlaylist",
							"class": "hide",
							"href": url,
							"download": "playlist.m3u"
						}).appendTo("body");

						$("#m3uPlaylist")[0].click();
						$("#m3uPlaylist").remove();

						window.URL.revokeObjectURL(url);
					}
				},
				load: function() {
					switch (session.request.call) {
						case "audio.get":
							session.requesting = true;
							slothMusic.audio.get(session.request.owner_id, (session.request.offset + 50));
							break;
						case "audio.getPopular":
							session.requesting = true;
							slothMusic.audio.getPopular(session.request.genre_id, (session.request.offset + 50));
							break;
						case "audio.getRecommendations":
							session.requesting = true;
							slothMusic.audio.getRecommendations(session.request.offset + 50);
							break;
						case "audio.search":
							session.requesting = true;
							slothMusic.audio.search(session.request.q, (session.request.offset + 50));
							break;
					}
				},
				ready: function() {
					if (session.device == "desktop") {
						$(playlist).on({
							mouseenter: function() {
								if (!$(this).find("small").hasClass("bitrate"))
									slothMusic.player.playlist.bitrate(session.uid, this);
							},
							click: function() {
								if (!$(this).find("small").hasClass("bitrate"))
									slothMusic.player.playlist.bitrate(session.uid, this);
							}
						}, "a");
					}
					$(playlist).on("click", "a", function(e) {
						if (session.mode == "listening") {
							if (e.target == this)
								if ($(this).hasClass("active"))
									if (session.player.status)
										slothMusic.player.controls.pause();
									else
										slothMusic.player.controls.play();
							else
								slothMusic.player.play($(this));
						} else if (session.mode == "download") {
							if (e.target == this)
								if (!$(this).hasClass("download-active"))
									$(this).addClass("download-active");
								else
									$(this).removeClass("download-active");
						}
					});
					$(playlist).on("click", "a > div > span.add", function() {
						var id = $(this).parent().parent().data("id");
						slothMusic.audio.add(session.playlist[id].owner_id, id);
						$(this).removeClass("add").addClass("added");
					});
					$(playlist).on("click", "a > div > span.delete", function() {
						var id = $(this).parent().parent().data("id");
						slothMusic.audio.delete(session.uid, id);
						$(this).removeClass("delete").addClass("deleted");
					});
				}
			}
		},
		audio: {
			/*
			// this.audio.reorder(audio_id, before, after); // перемещение аудиозаписи в плейлисте пользователя
			// this.audio.setBroadcast(owner_id, id, target_ids); // показать воспроизведение в статусе
			// this.audio.add(owner_id, id); // добавить аудиозапись пользователю
			// this.audio.delete(owner_id, id); // удалить аудиозапись у пользователя
			// this.audio.get(id); // получение аудиозаписей пользователя
			// this.audio.getPopular(); // популярные аудиозаписи
			// this.audio.getRecommendations(); // рекомендованные аудиозаписи
			// this.audio.search("поиск"); // поиск аудиозаписей
			// this.audio.genres; // жанры аудиозаписей
			*/
			init: function() {
				slothMusic.audio.ready();
			},
			reorder: function(audio_id, before, after) {
				VK.Api.call("audio.reorder", {
					audio_id: audio_id,
					owner_id: session.uid,
					before: before,
					after: after,
					v: 5.37
				}, function(r) {
					if (r.response) {
						// console.log(r);
					}
				});
			},
			setBroadcast: function(audio, target_ids) {
				if (audio == 0)
					session.broadcast = false;
				else
					session.broadcast = true;

				VK.Api.call("audio.setBroadcast", {
					audio: audio,
					target_ids: target_ids,
					v: 5.37
				}, function(r) {
					if (r.response) {
						// console.log(r.response);
					}
				});
			},
			add: function(owner_id, id) {
				VK.Api.call("audio.add", {
					owner_id: owner_id,
					audio_id: id,
					v: 5.37
				}, function(r) {
					if (r.response) {
						// console.log("added");
					}
				});
			},
			delete: function(owner_id, id) {
				VK.Api.call("audio.delete", {
					owner_id: owner_id,
					audio_id: id,
					v: 5.37
				}, function(r) {
					if (r.response) {
						// console.log("deleted");
					}
				});
			},
			get: function(owner_id, offset) {
				slothMusic.document.loading.show();
				VK.Api.call("audio.get", {
					owner_id: owner_id,
					count: 50,
					offset: offset,
					v: 5.37
				}, function(r) {
					slothMusic.document.loading.hide();
					if (r.response) {
						if (owner_id == session.uid || owner_id == null)
							session.sortable = true;
						else
							session.sortable = false;

						session.request = null;
						session.request = {
							call: "audio.get",
							owner_id: owner_id,
							offset: offset,
						}
						session.requesting = false;

						slothMusic.animation.player.next();
						if (offset <= 0)
							slothMusic.player.playlist.empty();
						slothMusic.player.playlist.add(r.response);
					}
				});
			},
			getPopular: function(genre_id, offset) {
				slothMusic.document.loading.show();
				VK.Api.call("audio.getPopular", {
					count: 50,
					genre_id: genre_id,
					offset: offset,
					v: 5.37,
				}, function(r) {
					slothMusic.document.loading.hide();
					if (r.response) {
						session.sortable = false;

						session.request = null;
						session.request = {
							call: "audio.getPopular",
							genre_id: genre_id,
							offset: offset,
						}
						session.requesting = false;

						slothMusic.animation.player.next();
						if (offset <= 0)
							slothMusic.player.playlist.empty();
						slothMusic.player.playlist.add(r.response);
					}
				});
			},
			getRecommendations: function(offset) {
				slothMusic.document.loading.show();
				VK.Api.call("audio.getRecommendations", {
					shuffle: 0,
					count: 50,
					offset: offset,
					v: 5.37
				}, function(r) {
					slothMusic.document.loading.hide();
					if (r.response) {
						session.sortable = false;

						session.request = null;
						session.request = {
							call: "audio.getRecommendations",
							offset: offset,
						}
						session.requesting = false;

						slothMusic.animation.player.next();
						if (offset <= 0)
							slothMusic.player.playlist.empty();
						slothMusic.player.playlist.add(r.response);
					}
				});
			},
			search: function(query, offset) {
				slothMusic.document.loading.show();
				VK.Api.call("audio.search", {
					q: query,
					auto_complete: 1,
					count: 50,
					offset: offset,
					v: 5.37
				}, function(r) {
					slothMusic.document.loading.hide();
					if (r.response) {
						session.sortable = false;

						session.request = null;
						session.request = {
							call: "audio.search",
							q: query,
							offset: offset
						}
						session.requesting = false;

						slothMusic.animation.player.next();
						if (offset <= 0)
							slothMusic.player.playlist.empty();
						slothMusic.player.playlist.add(r.response);
					}
				});
			},
			genres: {
				/*
				// this.audio.genres.get(); // получить массив жанров
				// this.audio.genres.list(); // заполнить лист жанрами
				*/
				btn: function(text) {
					if (text != null)
						$(controls.genres.text).text(text);
					else
						$(controls.genres.text).text("Жанр");
				},
				get: function() {
					var genres = new Array();

					genres[1] = "Rock";
					genres[2] = "Pop";
					genres[3] = "Rap & Hip-Hop";
					genres[4] = "Easy Listening";
					genres[5] = "Dance & House";
					genres[6] = "Instrumental";
					genres[7] = "Metal";
					genres[8] = "Dubstep";
					genres[9] = "Jazz & Blues";
					genres[10] = "Drum & Bass";
					genres[11] = "Trance";
					genres[12] = "Chanson";
					genres[13] = "Ethnic";
					genres[14] = "Acoustic & Vocal";
					genres[15] = "Reggae";
					genres[16] = "Classical";
					genres[17] = "Indie Pop";
					genres[18] = "Other";
					genres[19] = "Speech";
					genres[21] = "Alternative";
					genres[22] = "Electropop & Disco";

					return genres;
				},
				list: function() {
					var genres = slothMusic.audio.genres.get();

					$(genres).each(function(i, item) {
						if (i > 0 && i != 20) {
							$("<li/>").appendTo(controls.genres.list);
							$("<a/>", {
								"text": item,
								"data-id": i
							}).appendTo($(controls.genres.list).find("li:last-child"));
						}
					});
				},
			},
			ready: function() {
				slothMusic.audio.genres.list(); // заполнить жанры

				$(controls.genres.list).find("li > a").on("click", function() {
					slothMusic.audio.genres.btn($(this).text());
					slothMusic.audio.getPopular($(this).data("id"), 0);
				});
				$(controls.audio.shuffle).on("click", function() {
					slothMusic.player.playlist.shuffle();
				});
				$(controls.audio.alphabetically).clickToggle(function() {
					slothMusic.player.playlist.alphabetically();
				}, function() {
					slothMusic.player.playlist.alphabeticallyReverse();
				});
				$(controls.audio.my).on("click", function() {
					slothMusic.audio.genres.btn();
					slothMusic.audio.get(session.uid, 0);
				});
				$(controls.audio.popular).on("click", function() {
					slothMusic.audio.genres.btn();
					slothMusic.audio.getPopular(0, 0);
				});
				$(controls.audio.recommendations).on("click", function() {
					slothMusic.audio.genres.btn();
					slothMusic.audio.getRecommendations(0);
				});
				$(controls.audio.download).on("click", function() {
					if (session.mode == "listening") {
						session.mode = "download";
						slothMusic.animation.downloadAll.show();
						$(this).addClass("active");
					} else if (session.mode == "download") {
						if ($(playlist).find("a").hasClass("download-active")) {
							$(playlist).find("a.download-active").each(function(i, item) {
								id = $(item).data("id");
								url = session.playlist[id].url;
								url_trim = (url.replace("https", "http")).replace(/\?extra=(.*)/, "");
								session.downloading[i] = {
									artist: $.trim(session.playlist[id].artist),
									title: $.trim(session.playlist[id].title),
									owner_id: session.playlist[id].owner_id,
									id: session.playlist[id].id
								}
							});
							slothMusic.player.playlist.download(session.downloading);
						} else {
							session.mode = "listening";
							session.downloading = [];
							slothMusic.animation.downloadAll.hide();
							$(this).removeClass("active");
						}
					}
				});
				$(controls.audio.downloadAll).on("click", function() {
					if ($(playlist).find("a").hasClass("download-active"))
						$(playlist).find("a").removeClass("download-active");
					else
						$(playlist).find("a").addClass("download-active");
				});
				$(controls.audio.m3u).on("click", function() {
					slothMusic.player.playlist.generator.m3u();
				});

				$(controls.audio.broadcast).clickToggle(function() {
					if ($(playlist).find("a").hasClass("active")) {
						id = $(playlist).find("a.active").data("id");
						song = session.playlist[id];
						slothMusic.audio.setBroadcast(song.owner_id + "_" + song.id, session.uid);
						$(this).addClass("active");
					}
				}, function() {
					if ($(playlist).find("a").hasClass("active")) {
						slothMusic.audio.setBroadcast(0, session.uid);
						$(this).removeClass("active");
					}
				});

				$(controls.search.form).submit(function(e) {
					slothMusic.audio.genres.btn();
					slothMusic.audio.search($.trim($(query).val()), 0);
					e.preventDefault();
				});
			}
		},
		animation: {
			/*
			// this.animation.player; // анимация в плеере
			// this.animation.playlist; // анимация в плейлисте
			// this.animation.custom(el, animation, time); // присваивает класс css-анимации и убирает его по истечению времени
			*/
			player: {
				/*
				// this.animation.player.prev(); // анимация предыдущей песни
				// this.animation.player.next(); // анимация следующей песни
				*/
				prev: function() {
					slothMusic.animation.custom($(title), "animation-player-prev", 250);
				},
				next: function() {
					slothMusic.animation.custom($(title), "animation-player-next", 250);
				},
			},
			playlist: {
				/*
				// this.animation.playlist.moved(el); // анимация после перемещения аудиозаписи в плейлисте
				*/
				moved: function(el) {
					if ($(el).hasClass("active"))
						slothMusic.animation.custom(el, "animation-playlist-moved-active", 1000);
					else
						slothMusic.animation.custom(el, "animation-playlist-moved", 1000);
				},
			},
			downloadAll: {
				show: function() {
					$(controls.audio.downloadAll).removeClass("hide");
					slothMusic.animation.custom(controls.audio.downloadAll, "animation-opacity-in", 250);
				},
				hide: function() {
					slothMusic.animation.custom(controls.audio.downloadAll, "animation-opacity-out", 250);
					$(controls.audio.downloadAll).addClass("hide");
				},
			},
			custom: function(el, animation, time) {
				$(el).addClass(animation);
				setTimeout(function() {
					$(el).removeClass(animation);
				}, time);
			},
		},
	};

	/*
	//	действия при готовности всех элементов на странице
	*/
	$(document).ready(function() {
		slothMusic.init();
	});

	/*
	//	действия при изменении размеров браузера
	*/
	$(window).resize(function() {

	});

	/*
	//	действия при скролле
	*/
	$(window).scroll(function() {
		if ($(window).scrollTop() + $(window).height() >= $(document).height() - 200 && !session.requesting) {
			slothMusic.player.playlist.load();
		}
	});


})(jQuery);

/*
//	функция shuffle: перемешивает элементы селектора
*/
(function($) {
	$.fn.shuffle = function() {
		var allElems = this.get(),
			getRandom = function(max) {
				return Math.floor(Math.random() * max);
			},
			shuffled = $.map(allElems, function() {
				var random = getRandom(allElems.length),
					randEl = $(allElems[random]).clone(true)[0];
				allElems.splice(random, 1);
				return randEl;
			});
		this.each(function(i) {
			$(this).replaceWith($(shuffled[i]));
		});
		return $(shuffled);
	};
})(jQuery);

/*
//	функция alphabetically: сортировка по алфавиту
*/
$(function() {
	$.fn.alphabetically = function() {
		var mylist = $(this);
		var listitems = $("a", mylist).get();
		listitems.sort(function(a, b) {
			var compA = $(a).text().toUpperCase();
			var compB = $(b).text().toUpperCase();
			return (compA < compB) ? -1 : 1;
		});
		$.each(listitems, function(i, itm) {
			mylist.append(itm);
		});
	}
});

/*
//	функция alphabeticallyReverse: сортировка по алфавиту (в обратном порядке)
*/
$(function() {
	$.fn.alphabeticallyReverse = function() {
		var mylist = $(this);
		var listitems = $("a", mylist).get();
		listitems.sort(function(a, b) {
			var compA = $(a).text().toUpperCase();
			var compB = $(b).text().toUpperCase();
			return (compA > compB) ? -1 : 1;
		});
		$.each(listitems, function(i, itm) {
			mylist.append(itm);
		});
	}
});

/*
//	функция clickToggle: выполняет функции по клику (поочередно)
*/
jQuery.fn.clickToggle = function(a, b) {
	var ab = [b, a];

	function cb() {
		ab[this._tog ^= 1].call(this);
	}
	return this.on("click", cb);
};
