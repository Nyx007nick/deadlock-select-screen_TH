import { useContext, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Character } from "./components/Character";
import { useBGM } from "./hooks/useBGM";
import { Modal } from "./components/Modal";
import { AbilityDetailsDialog } from "./components/AbilityDetailsDialog";
import { CharactersContext } from "./context/CharactersContext";
import { useHover } from "./hooks/useHover";
import { useSingleAudio } from "./hooks/useSingleAudio";
import { useHoverDelay } from "./hooks/useHoverDelay"

import voice_list from "./assets/vo_list.json"
import thaiVoiceManifest from "./assets/voiceThaiManifest.json"
import { characterNameImagesTH, getAbilityName, getCharacterName, getCharacterTag } from "./assets/characterTranslations"
import characterLoreThai from "./assets/characterLoreThai.json"
import { usePressedKeys } from "./hooks/usePressedKeys";

// import { Canvas, useFrame } from "@react-three/fiber";
// import { useGLTF, OrbitControls } from "@react-three/drei";
// import * as THREE from "three";


// function Model() {
//   const gltf = useGLTF("Paradox2.glb");



//   return (
//     <primitive
//       object={gltf.scene}
//       scale={1}
//     />
//   );
// }

const hero_colors = {
    "Abrams": { color: "#2092AE" },
    "Apollo": { color: "#FF3333" },
    "Baba": { color: "#895672" },
    "Bebop": { color: "#9F4734" },
    "Billy": { color: "#D4AD0E", text: "#10130D" },
    "Calico": { color: "#572798" },
    "Celeste": { color: "#BBA9E1", text: "#10130D" },
    "Deadman Danny": { color: "#CE8D2A" },
    "Doorman": { color: "#B77528" },

    "Drifter": { color: "#9D2C2B" },
    "Dynamo": { color: "#D0B945" },
    "Graves": { color: "#D9F334", text: "#10130D" },
    "Grey Talon": { color: "#5EB083" },
    "Haze": { color: "#AC6133" },
    "Holliday": { color: "#A35A1B" },
    "Infernus": { color: "#C93C26" },
    "Ivy": { color: "#9D8CA9" },
    "Kelvin": { color: "#74ABBC" },

    "Lady Geist": { color: "#218440" },
    "Lash": { color: "#4174BB" },
    "McGinnis": { color: "#23549D" },
    "Mina": { color: "#A9171E", text: "#A9171E", text_back: "#200B0B" },
    "Mirage": { color: "#6A2E68" },
    "Mo Krill": { color: "#C58428" },
    "Nurse Harrow": { color: "#f55e20" },
    "Paige": { color: "#258F63" },
    "Paradox": { color: "#983952" },


    "Pocket": { color: "#858617" },
    "Rat King": { color: "#733033" },
    "Rem": { color: "#5383D1", text: "#10130D" },
    "Seven": { color: "#CC861E" },
    "Shiv": { color: "#E52A68" },
    "Silver": { color: "#BFBC9F", text: "#10130D" },
    "Sinclair": { color: "#6B6B6B", text: "#10130D" },
    "Solomon": { color: "#AA9E7E" },
    "Venator": { color: "#BD3599" },

    "Victor": { color: "#658B6F" },
    "Vindicta": { color: "#A2C7E5", text: "#10130D" },
    "Violet": { color: "#653cbc" },
    "Viscous": { color: "#319826" },
    "Vyper": { color: "#A7AD00", text: "#10130D" },
    "Warden": { color: "#4D68A3" },
    "Wraith": { color: "#944D78" },
    "Yamato": { color: "#625789" },
};

export function Home() {

    const { characters, isRosterMode, toggleSelectionMode, selectedCharacters, setSelectedCharacters, toggleCharacter, change_character_priority, selectionDone, setSelectionDone, displayedCharacter, setDisplayedCharacter } = useContext(CharactersContext)

    const canPlay = Object.keys(selectedCharacters).length > 2
    const [randomizeCount, setRandomizeCount] = useState(Math.max(3, Object.keys(selectedCharacters).length));

    const [loreOpen, setLoreOpen] = useState(false)
    const [aboutModalOpen, setAboutModalOpen] = useState(false)
    const [selectedAbility, setSelectedAbility] = useState(null)

    const current_colors = characters ? hero_colors[characters[displayedCharacter].name]?? "" : {}

    const hero_color = current_colors.color
    const hero_tag_color = current_colors.text_back ?? hero_color
    const hero_text_color = current_colors.text ?? "#ffffff"

    const character_image = useRef(null)
    const character_image_shadow = useRef(null)
    const play_button_ref = useRef(null)

    const { onEnter, onLeave } = useHoverDelay(setDisplayedCharacter, 150)
    const pressedKeys = usePressedKeys()

    const { autoPlay, toggleMute } = useBGM()
    const play_hover = useHover(50)
    const play_select_audio = useSingleAudio(1, 0.15)
    const play_voice_audio = useSingleAudio(50, 0.4)



    async function showModal() {
        setLoreOpen(true)
    }
    const translations = {
        EN: {},
        TH: {
            "Loading...": "กำลังโหลด...",
            NEW: "ใหม่",
            "MUSIC ON": "เปิดเพลง",
            "MUSIC OFF": "ปิดเพลง",
            "CREATE ROSTER": "จัดทีม",
            "SELECT HERO": "เลือกฮีโร่",
            PLAY: "เล่น",
            BACK: "กลับ",
            "Scroll wheel to change number of chars": "เลื่อนล้อเมาส์เพื่อเปลี่ยนจำนวนตัวละคร",
            RANDOMIZE: "สุ่มตัวละคร",
            DONATE: "สนับสนุน",
            ABOUT: "เกี่ยวกับ",
            "IN ROSTER": "อยู่ในทีม",
            "HIGH PRIORITY": "ลำดับสูง",
            "ULTRA HIGH PRIORITY": "ลำดับสูงมาก",
            "I ONLY WANT TO PLAY THIS CHARACTER PRIORITY": "ต้องการเล่นตัวละครนี้เท่านั้น",
            PRIORITY: "ลำดับความสำคัญ",
            "Remove from Roster": "นำออกจากทีม",
            "Make High Priority": "ตั้งเป็นลำดับสูง",
            "Avoid Hero": "หลีกเลี่ยงฮีโร่",
            "Backstory:": "ประวัติตัวละคร:",
            Close: "ปิด",
            "About this project.": "เกี่ยวกับโปรเจกต์นี้",
            "I used the following tools to make this site:": "เครื่องมือที่ใช้สร้างเว็บไซต์นี้:",
            "For game assets extraction, including music, 3d models, images, etc.": "สำหรับดึงไฟล์เกม เช่น เพลง โมเดล 3 มิติ และรูปภาพ",
            "For image optimization and compression": "สำหรับปรับแต่งและบีบอัดรูปภาพ",
            'To create missing renders of characters (the ones that were not available at "Deadlock Graphical Library")': 'สำหรับสร้างภาพตัวละครที่ไม่มีใน "Deadlock Graphical Library"',
            "For image editing and manipulation, mainly composing the character renders and backgrounds.": "สำหรับแก้ไขรูปภาพ โดยเฉพาะการจัดองค์ประกอบภาพตัวละครและฉากหลัง",
            "TO DO:": "สิ่งที่ต้องทำ:",
            "Multiple character selection": "เลือกตัวละครได้หลายตัว",
            "Show info of character abilities": "แสดงข้อมูลสกิลของตัวละคร",
            "Improve shadow animation of characters": "ปรับปรุงเอฟเฟกต์เงาของตัวละคร",
            "Maybe custom skins?": "เพิ่มสกินแบบกำหนดเอง",
            "Add proper optimization for resource loading (tiny thumbnails while full size image loads, preload, load screen maybe, etc.)": "ปรับปรุงการโหลดทรัพยากร เช่น ภาพตัวอย่างขนาดเล็ก การโหลดล่วงหน้า และหน้าจอโหลด",
            "I spent more time making this project than playing the actual game... (see rem at the back for reference)": "ใช้เวลาทำโปรเจกต์นี้มากกว่าเล่นเกมจริงเสียอีก... (ดู Rem ด้านหลังเป็นตัวอย่าง)",
        },
    };


    async function closeModal() {
        setLoreOpen(false)
    }

        const [language, setLanguage] = useState(() => window.localStorage.getItem("deadlock-language") === "TH" ? "TH" : "EN")
        const t = (text) => translations[language][text] || text

        useEffect(() => {
            document.documentElement.lang = language.toLowerCase()
            window.localStorage.setItem("deadlock-language", language)
        }, [language])

        function changeLanguage(nextLanguage) {
            setLanguage(nextLanguage)
        }
    function sleep(ms) { // timer
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    

    const timer = useRef(null);
    async function finishRandomize(last_char) {


        clearTimeout(timer.current);
        timer.current = setTimeout(() => { 
            setSelectionDone(true), 
            play_select_clip("select", last_char) 
            setDisplayedCharacter(last_char)
        }, 200);

    }
    



    // useEffect(() => {
    //     if (!characters) {
    //         return
    //     }

    //     var char_name = characters[displayedCharacter].name


    //     if (selectionDone) {

    //         var clip_list = voice_list[char_name]["selected"].length
    //         var random_clip = Math.floor(Math.random() * clip_list)

    //         var voice_clip = voice_list[char_name]["selected"].at(random_clip)
    //         play_select_audio(`${import.meta.env.VITE_ASSETS_SOURCE}sounds/select.mp3`)



    //         play_voice_audio(`${import.meta.env.VITE_ASSETS_SOURCE}vo/${char_name}/${voice_clip}`)

    //     }
    //     else {
    //         let clip_list = voice_list[char_name]["unselected"].length

    //         let random_clip = Math.floor(Math.random() * clip_list)

    //         let voice_clip = voice_list[char_name]["unselected"].at(random_clip)

    //         play_voice_audio(`${import.meta.env.VITE_ASSETS_SOURCE}vo/${char_name}/${voice_clip}`)
    //     }

    // }, [selectedCharacters])

    function play_select_clip(audio_type, char_index) {

        var char_name = characters[char_index].name
        const voice_group = audio_type === "select" ? "selected" : "unselected"
        const english_clips = voice_list[char_name][voice_group]
        const thai_clips = thaiVoiceManifest.clips?.[char_name]?.[voice_group] ?? {}
        const available_clips = language === "TH"
            ? Object.keys(thai_clips).filter((clip) => english_clips.includes(clip))
            : english_clips
        const voice_clip = available_clips.at(Math.floor(Math.random() * available_clips.length))

        if (audio_type === "select") {
            play_select_audio(`${import.meta.env.VITE_ASSETS_SOURCE}sounds/select.mp3`)
        }

        if (!voice_clip) return
        const audio_url = language === "TH"
            ? `${import.meta.env.BASE_URL}${thai_clips[voice_clip]}`
            : `${import.meta.env.VITE_ASSETS_SOURCE}vo/${char_name}/${voice_clip}`
        play_voice_audio(audio_url)

    }

    async function randomize() {
        //play_select_clip("unselect", displayedCharacter)

        for (let i = 0; i < 20; i++) {
            var random_characters = {}

            for (let i = 0; i < Math.min(randomizeCount, characters.length); i++) {
                var random = Math.floor(Math.random() * characters.length)
                while (random in random_characters) {
                    random = Math.floor(Math.random() * characters.length)
                }
                random_characters[random] = 0
            }

            await sleep(50)

            //setDisplayedCharacter(random_characters.at(-1))
            setSelectedCharacters(random_characters)
            play_hover()
            finishRandomize(Object.keys(random_characters).at(-1))

        }

    }


    function rotate_character(e) {
        if (!character_image.current) {
            return
        }


        var offset = (e.clientX / window.innerWidth) * 6 - 4;

        //console.log(offset)

        character_image.current.style.transform = `rotateY(${offset}deg)`
        character_image_shadow.current.style.transform = `rotateY(${offset}deg)`

    }

    useEffect(() => {

        window.addEventListener("mousemove", rotate_character)

        return () => {

            window.removeEventListener("mousemove", rotate_character)

        }


    }, [])

    useEffect(() => {
        setRandomizeCount(Math.max(3, Object.keys(selectedCharacters).length));
    }, [Object.keys(selectedCharacters).length]);

    function play_button_hover(e) {

        var type = e.type

        var element = play_button_ref.current
        var image_element = element.children[2]

        if (!canPlay){
            return
        }

        if (type == "mouseenter") {

            element.classList.add("hover")
            image_element.src = "play_box_fill.png"

        }
        else {
            element.classList.remove("hover")
            image_element.src = "play_box.png"
        }

    }

    function change_random_count(e){
        if (e.deltaY < 0){
            setRandomizeCount(Math.min(characters.length, randomizeCount+1))
        }
        else{
            setRandomizeCount(Math.max(3, randomizeCount -1))
            
        }
        
    }


    if (!characters) {
        return (
            <div className="loading-screen">
                <img src="logo.png"></img>
                <h1>{t("Loading...")}</h1>

            </div>
        )
    }


    return (
        <div id="screen" className="screen">


            {/* <div className="top-bar">

                <div className="top-bar-button">
                    <img src="esc.png"></img>
                </div>


            </div> */}



            <video className="video-background" src="roster_bg_loop.webm" ref={video => video && (video.playbackRate = 0.5)} autoPlay muted loop playsInline disablePictureInPicture></video>
            <div className="language-switch" role="group" aria-label="Language">
                {["TH", "EN"].map((option) => (
                    <button key={option} type="button" aria-pressed={language === option} className={language === option ? "active" : ""} onClick={() => changeLanguage(option)}>
                        {option}
                    </button>
                ))}
            </div>
            <button className="mute-button" onClick={toggleMute} >
                <img src={`${autoPlay ? "music_on.png" : "music_off.png"}`}></img>
                <p>{t(autoPlay ? "MUSIC ON" : "MUSIC OFF")}</p>
            </button>
            <div className="character-selection">

                <div className="character-selection-title">
                    <p>DEADLOCK</p>
                    <h1>{t(isRosterMode ? "CREATE ROSTER" : "SELECT HERO")}</h1>
                </div>

                <div className="characters-grid">
                    {characters.map((item, index) => (
                        <Character key={item.name + index} character={item} displayName={getCharacterName(item.name, language)} character_index={index} priority={selectedCharacters[index]} toggleCharacter={toggleCharacter}
                            isSelected={index in selectedCharacters}  selectionDone={selectionDone} 
                            setSelectionDone={setSelectionDone} play_hover={play_hover}
                            setDisplayedCharacter={setDisplayedCharacter} change_character_priority={change_character_priority}
                            onEnter={onEnter} onLeave={onLeave} play_select_clip={play_select_clip} pressedKeys={pressedKeys.current} t={t}>

                        </Character>
                    ))}

                </div>

                <div className="play-button-container" >

                    <button ref={play_button_ref} onMouseEnter={play_button_hover} onMouseLeave={play_button_hover} className={`play-button ${canPlay ? "" : "inactive"}`}
                            onClick={()=>{play_voice_audio(`${import.meta.env.VITE_ASSETS_SOURCE}vo/Rem/unselect_10.opus`)}}>
                        <p>{t("PLAY")}</p>
                        <img className="play-button-image" src="play_btn_flames.gif"></img>
                        <img className="play-button-image" src="play_box.png">

                        </img>
                    </button>

                </div>

            </div>

            <div className="player-character" >

                <img key={characters[displayedCharacter].name} className="character-background" src={`${import.meta.env.VITE_ASSETS_SOURCE}backgrounds/${characters[displayedCharacter].background}`} />
                <img ref={character_image_shadow} key={characters[displayedCharacter].name + 2} className="character-shadow" src={`${import.meta.env.VITE_ASSETS_SOURCE}characters/${characters[displayedCharacter].name}.png`} ></img>

                <img ref={character_image} key={characters[displayedCharacter].name + 1} className="character" src={`${import.meta.env.VITE_ASSETS_SOURCE}characters/${characters[displayedCharacter].name}.png`} ></img>

                {/* <model-viewer className="canvas" alt="Paradox" src="Paradox2.glb"  shadow-intensity="1" camera-controls touch-action="pan-y"></model-viewer> */}

                <div className="player-character-info">
                    {language === "TH" && characterNameImagesTH[characters[displayedCharacter].name] ? (
                        <img
                            className="player-character-info-name"
                            alt={getCharacterName(characters[displayedCharacter].name, language)}
                            src={`${import.meta.env.BASE_URL}hero_names_th/${characterNameImagesTH[characters[displayedCharacter].name]}.svg`}
                        />
                    ) : language === "EN" ? (
                        <img className="player-character-info-name" alt={characters[displayedCharacter].name} src={`${import.meta.env.VITE_ASSETS_SOURCE}names/${characters[displayedCharacter].name}.svg`}></img>
                    ) : (
                        <p className="player-character-info-name player-character-info-name-text">{getCharacterName(characters[displayedCharacter].name, language)}</p>
                    )}
                    <div className="player-character-info-tags-container">



                        {characters[displayedCharacter].tags.map((tag) => (
                            <div className="player-character-tag-container">
                                <div style={{ backgroundColor: hero_tag_color }} className="player-character-tag-background" > </div>
                                <p style={{ color: hero_text_color }} key={tag} className="player-character-info-tag" >{getCharacterTag(tag, language)}</p>
                            </div>

                        ))}



                    </div>

                    <div className="player-character-info-skills-container">
                        {characters[displayedCharacter].abilities.map((ability, index) => (
                            <button
                                key={`${characters[displayedCharacter].name}-${index}-${ability}`}
                                type="button"
                                style={{ color: hero_color }}
                                className="player-character-info-skill"
                                aria-label={`${getAbilityName(ability, language)} — ${getCharacterName(characters[displayedCharacter].name, language)}`}
                                title={getAbilityName(ability, language)}
                                onClick={(event) => {
                                    setSelectedAbility({
                                        heroName: characters[displayedCharacter].name,
                                        ability,
                                        trigger: event.currentTarget,
                                    })
                                }}
                            >
                                <img alt="" src={`${import.meta.env.VITE_ASSETS_SOURCE}abilities/${characters[displayedCharacter].name}/${index + 1}.png`} />
                            </button>
                        ))}
                    </div>

                </div>

            </div>

            {selectedAbility && (
                createPortal(
                    <AbilityDetailsDialog
                        ability={selectedAbility.ability}
                        abilities={characters.find((character) => character.name === selectedAbility.heroName).abilities}
                        heroName={selectedAbility.heroName}
                        heroColor={hero_colors[selectedAbility.heroName].color}
                        language={language}
                        onSelectAbility={(ability) => setSelectedAbility((current) => ({ ...current, ability }))}
                        onClose={() => {
                            selectedAbility.trigger?.focus()
                            setSelectedAbility(null)
                        }}
                    />,
                    document.body,
                )
            )}

            <div className="bottom-bar">

                <div className="bottom-bar-buttons-container" >

                    <div className="bottom-bar-escape">
                        <img src="esc.png"></img>
                        <p>{t("BACK")}</p>
                    </div>

                    <button onClick={randomize} className="bottom-bar-randomizer">
                        <div>
                            <img src="random.png"></img>
                        </div>

                        <p onWheel={change_random_count} title={t("Scroll wheel to change number of chars")}>{t("RANDOMIZE")}({randomizeCount})</p>
                    </button>

                    <a href="https://ko-fi.com/dkstuff" target="_blank" className="bottom-bar-randomizer">
                        <div>
                            <img src="donate.png"></img>
                        </div>

                        <p>{t("DONATE")}</p>
                    </a>

                    <button onClick={() => setAboutModalOpen(true)} className="bottom-bar-randomizer">
                        <div>
                            <img src="about.png"></img>
                        </div>

                        <p>{t("ABOUT")}</p>
                    </button>

                    {/* <div className="bottom-bar-randomizer">
                        <button  >RANDOMIZER</button>
                    </div> */}

                </div>

                <div className="lore-button-container">
                    <button onClick={() => { showModal() }} className="lore-button">
                        <img src="lore.png">
                        </img>
                    </button>
                </div>

            </div>

            <Modal isOpen={loreOpen} close={closeModal}  >
                <div className='character-lore-container'>
                    <h1>
                        {t("Backstory:")}
                    </h1>
                    <div className="character-lore-text-container">
                        {!characters[displayedCharacter].lore && (
                            <p>{language === "TH" ? "ยังไม่มีข้อมูลประวัติสำหรับตัวละครนี้" : "Backstory is unavailable for this character."}</p>
                        )}
                        {language === "TH" && characters[displayedCharacter].lore && !characterLoreThai.characters[characters[displayedCharacter].name] && (
                            <p>{`ยังไม่มีประวัติภาษาไทยสำหรับตัวละครนี้ — แสดงฉบับภาษาอังกฤษ`}</p>
                        )}
                        {characters[displayedCharacter].lore && (
                            <p>
                                {language === "TH"
                                    ? characterLoreThai.characters[characters[displayedCharacter].name] || characters[displayedCharacter].lore
                                    : characters[displayedCharacter].lore}
                            </p>
                        )}

                    </div>

                    <button onClick={closeModal}>
                        {t("Close")}
                    </button>
                </div>
            </Modal>

            <Modal isOpen={aboutModalOpen} close={() => { setAboutModalOpen(false) }}  >
                <div className='character-lore-container'>
                    <img src="myboyrem.jpg">
                    </img>
                    <h1>
                        {t("About this project.")}
                    </h1>
                    <div className="character-lore-text-container">
                        <h2>{t("I used the following tools to make this site:")}</h2>

                        <ul>
                            <li>
                                <p>{language === "TH" ? "ขอขอบคุณผู้ใช้ " : "Credits to user "}<b>"Lovely"</b>{language === "TH" ? " ที่สร้าง " : " for creating "}<a href="https://forums.playdeadlock.com/resources/deadlock-graphical-library.30/updates" target="_blank">"Deadlock Graphical Library"</a>{language === "TH" ? " และแบ่งปันภาพตัวละครต้นฉบับ (ไม่สามารถติดต่อได้เนื่องจากลิงก์ Discord ของโปรเจกต์ใช้งานไม่ได้)" : " and uploading raw character renders. (could not contact him because the project's discord link is broken)"}</p>
                            </li>

                            <li>
                                <p> <a href="https://s2v.app/" target="_blank">Source2Viewer</a>: {t("For game assets extraction, including music, 3d models, images, etc.")}</p>
                            </li>

                            <li>
                                <p> <a href="https://github.com/kornelski/pngquant" target="_blank">pngquant</a> & <a href="https://github.com/oxipng/oxipng" target="_blank">oxipng</a>: {t("For image optimization and compression")}</p>
                            </li>

                            <li>
                                <p> <a href="https://www.blender.org/download/" target="_blank">Blender</a>: {t('To create missing renders of characters (the ones that were not available at "Deadlock Graphical Library")')}</p>
                            </li>

                            <li>
                                <p> <b>GIMP</b>: {t("For image editing and manipulation, mainly composing the character renders and backgrounds.")}</p>
                            </li>
                        </ul>

                        <h2>{t("TO DO:")}</h2>


                        <ul>
                            <li>
                                <p>{t("Multiple character selection")}</p>
                            </li>
                            <li>
                                <p>{t("Show info of character abilities")}</p>
                            </li>

                            <li>
                                <p>{t("Improve shadow animation of characters")}</p>
                            </li>
                            <li>
                                <p>{t("Maybe custom skins?")}</p>
                            </li>
                            <li>
                                <p>{t("Add proper optimization for resource loading (tiny thumbnails while full size image loads, preload, load screen maybe, etc.)")}</p>
                            </li>

                        </ul>

                        <h3>{t("I spent more time making this project than playing the actual game... (see rem at the back for reference)")}</h3>

                    </div>




                    <button onClick={() => { setAboutModalOpen(false) }}>
                        {t("Close")}
                    </button>
                </div>
            </Modal>


        </div>
    )
}