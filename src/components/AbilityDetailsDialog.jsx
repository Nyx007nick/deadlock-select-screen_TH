import { useCallback, useEffect, useRef, useState } from "react"
import { getAbilityName, getCharacterName } from "../assets/characterTranslations"
import "./AbilityDetailsDialog.css"

const statusTranslations = {
    "BonusFireRate": "อัตราการยิงเพิ่มขึ้น",
    "Bonus Fire Rate": "อัตราการยิงเพิ่มขึ้น",
    "BonusMoveSpeed": "ความเร็วเคลื่อนที่เพิ่มขึ้น",
    "Bonus Move Speed": "ความเร็วเคลื่อนที่เพิ่มขึ้น",
    "BonusSpiritDamage": "ความเสียหายพลังวิญญาณเพิ่มขึ้น",
    "Bonus Spirit Damage": "ความเสียหายพลังวิญญาณเพิ่มขึ้น",
    "BonusSprintSpeed": "ความเร็ววิ่งเพิ่มขึ้น",
    "Bonus Sprint Speed": "ความเร็ววิ่งเพิ่มขึ้น",
    "BonusWeaponDamage": "ความเสียหายอาวุธเพิ่มขึ้น",
    "Bonus Weapon Damage": "ความเสียหายอาวุธเพิ่มขึ้น",
    "BulletResist": "ต้านทานกระสุน",
    "Bullet Resist": "ต้านทานกระสุน",
    "CombatBarrier": "โล่ต่อสู้",
    "Combat Barrier": "โล่ต่อสู้",
    "DamageAmp": "เพิ่มความเสียหาย",
    "Damage Amp": "เพิ่มความเสียหาย",
    "Disarming": "ปลดอาวุธ",
    "Disarm": "ปลดอาวุธ",
    "Fear": "หวาดกลัว",
    "FireRate": "อัตราการยิง",
    "Fire Rate": "อัตราการยิง",
    "Flying": "บิน",
    "Heal": "ฟื้นฟู",
    "Healing": "ฟื้นฟู",
    "Heals": "ฟื้นฟู",
    "Immobilized": "หยุดเคลื่อนที่",
    "Immobilize": "หยุดการเคลื่อนที่",
    "Knockdown": "ล้มลง",
    "Knockback": "กระเด็น",
    "KnockBack": "กระเด็น",
    "KnockUp": "ลอยขึ้น",
    "MaxHealth": "พลังชีวิตสูงสุด",
    "MeleeDamage": "ความเสียหายประชิด",
    "MoveSpeed": "ความเร็วเคลื่อนที่",
    "Pulling": "ดึง",
    "Pulls": "ดึง",
    "PureDamage": "ความเสียหายแท้",
    "Regen": "ฟื้นฟู",
    "ReducedFireRate": "ลดอัตราการยิง",
    "Silence": "ใบ้สกิล",
    "SlowResistance": "ต้านทานการลดความเร็ว",
    "Spirit Resist": "ต้านทานพลังวิญญาณ",
    "SpiritDPS": "ความเสียหายพลังวิญญาณต่อวินาที",
    "SpiritDamage": "ความเสียหายพลังวิญญาณ",
    "SpiritIcon": "พลังวิญญาณ",
    "Stun": "สตัน",
    "Slowing": "ลดความเร็ว",
    "Slow": "ลดความเร็ว",
    "Unstoppable": "ต้านทานสถานะ",
    "SpiritResist": "ต้านทานพลังวิญญาณ",
    "WeaponDamage": "ความเสียหายอาวุธ",
}

const statTranslations = {
    "Ability Cooldown": "คูลดาวน์สกิล",
    "Ability Duration": "ระยะเวลาสกิล",
    "Ability Range": "ระยะสกิล",
    "Attack Speed": "ความเร็วโจมตี",
    "Cast Delay": "เวลาร่าย",
    "Cast Range": "ระยะร่าย",
    "Channel Duration": "ระยะเวลาร่ายต่อเนื่อง",
    "Charge Delay": "เวลาชาร์จ",
    "Bullet Damage": "ความเสียหายกระสุน",
    "Bullet Resist": "ต้านทานกระสุน",
    "Charges": "จำนวนครั้งที่ใช้ได้",
    "Cooldown": "คูลดาวน์",
    "Damage": "ความเสียหาย",
    "Deadhead Lifetime": "ระยะเวลาก่อนหัวศพหาย",
    "Duration": "ระยะเวลา",
    "Enemy health threshold": "เกณฑ์พลังชีวิตศัตรู",
    "Heal": "ฟื้นฟู",
    "Healing": "การฟื้นฟู",
    "Hero Damage to Heal": "ความเสียหายต่อฮีโร่ที่เปลี่ยนเป็นการฟื้นฟู",
    "Health": "พลังชีวิต",
    "Impact Radius": "รัศมีปะทะ",
    "Missing Health as Healing": "พลังชีวิตที่หายไปซึ่งเปลี่ยนเป็นการฟื้นฟู",
    "Bonus Item Duration/Range": "โบนัสระยะเวลา/ระยะของไอเทม",
    "Move Speed": "ความเร็วเคลื่อนที่",
    "Range": "ระยะ",
    "Radius": "รัศมี",
    "Slash Length": "ระยะฟัน",
    "Slash Radius": "รัศมีฟัน",
    "Spirit Damage": "ความเสียหายพลังวิญญาณ",
    "Spirit Resist": "ต้านทานพลังวิญญาณ",
    "Stun Duration": "ระยะเวลาสตัน",
    "Time Window": "ช่วงเวลา",
    "Unknown(AuraFireRateBonus)": "โบนัสอัตราการยิงจากออร่า",
    "Unknown(LifeStealPercentOnHit)": "ดูดเลือดเมื่อโจมตีโดน",
    "Weapon Damage": "ความเสียหายอาวุธ",
    "Wall Length": "ความยาวกำแพง",
}

const bindingTranslations = {
    ADS: "ปุ่มเล็ง",
    Ability: "ปุ่มสกิล",
    Ability1: "ปุ่มสกิล 1",
    Ability2: "ปุ่มสกิล 2",
    Ability3: "ปุ่มสกิล 3",
    Ability4: "ปุ่มสกิล 4",
    AltCast: "ปุ่มร่ายอีกแบบ",
    Attack: "ปุ่มโจมตี",
    Crouch: "ปุ่มย่อตัว",
    Mantle: "ปุ่มปีน",
    MoveForward: "ปุ่มเดินหน้า",
    Roll: "ปุ่มกลิ้ง",
}

const bindingEnglishNames = {
    ADS: "Aim",
    Ability: "Ability",
    Ability1: "Ability 1",
    Ability2: "Ability 2",
    Ability3: "Ability 3",
    Ability4: "Ability 4",
    AltCast: "Alternate cast",
    Attack: "Attack",
    Crouch: "Crouch",
    Mantle: "Mantle",
    MoveForward: "Move forward",
    Roll: "Roll",
}

const propertyWordTranslations = {
    Ability: "สกิล",
    Accuracy: "ความแม่นยำ",
    Amp: "เพิ่ม",
    Armor: "เกราะ",
    As: "เป็น",
    Active: "เมื่อกดใช้",
    Air: "กลางอากาศ",
    Amount: "ปริมาณ",
    Ally: "พันธมิตร",
    Amplification: "การขยายผล",
    Angle: "มุม",
    Attack: "โจมตี",
    Aura: "ออร่า",
    Barrier: "โล่",
    Base: "พื้นฐาน",
    Bats: "ค้างคาว",
    Bleed: "เลือดไหล",
    Bonus: "โบนัส",
    Barriers: "โล่",
    Bounce: "เด้ง",
    Bounces: "เด้ง",
    Bullet: "กระสุน",
    Bullets: "กระสุน",
    Burn: "เผาไหม้",
    Burst: "ระเบิด",
    Capture: "ยึด",
    Check: "เช็กเอาต์",
    Checkout: "เช็กเอาต์",
    Cast: "ร่าย",
    Chain: "ต่อเนื่อง",
    Chance: "โอกาส",
    Channel: "ร่ายต่อเนื่อง",
    Charge: "ชาร์จ",
    Charges: "จำนวนครั้ง",
    Clip: "แม็กกาซีน",
    Copied: "ที่คัดลอก",
    Current: "ปัจจุบัน",
    Deadhead: "หัวศพ",
    Deadheads: "หัวศพ",
    Cooldown: "คูลดาวน์",
    DPS: "ความเสียหายต่อวินาที",
    Damage: "ความเสียหาย",
    Deferred: "ที่เลื่อนออกไป",
    Dash: "พุ่ง",
    Debuffs: "ดีบัฟ",
    Debuff: "ดีบัฟ",
    Delay: "เวลาเตรียม",
    Delayed: "ที่หน่วงเวลา",
    Distance: "ระยะ",
    Dot: "ต่อเนื่อง",
    Evasion: "หลบหลีก",
    Drain: "ดูด",
    Duration: "ระยะเวลา",
    Effectiveness: "ประสิทธิภาพ",
    Enemy: "ศัตรู",
    Explosion: "ระเบิด",
    Fire: "ยิง",
    FireRate: "อัตราการยิง",
    Fading: "ค่อย ๆ ลด",
    Fixed: "คงที่",
    Full: "เต็ม",
    Ghoul: "ผีดิบ",
    Ghouls: "ผีดิบ",
    HP: "พลังชีวิต",
    Heal: "ฟื้นฟู",
    Healing: "การฟื้นฟู",
    Health: "พลังชีวิต",
    Heavy: "หนัก",
    Hero: "ฮีโร่",
    Heroes: "ฮีโร่",
    Hold: "กดค้าง",
    Hit: "โจมตีโดน",
    Incoming: "ที่ได้รับ",
    Increase: "เพิ่ม",
    Item: "ไอเทม",
    Jumps: "ครั้งที่กระโดด",
    Kill: "สังหาร",
    Lifetime: "ระยะเวลาก่อนหาย",
    Lifesteal: "ดูดเลือด",
    Life: "ชีวิต",
    Marks: "มาร์ก",
    Max: "สูงสุด",
    Melee: "ประชิด",
    Min: "ต่ำสุด",
    Minimum: "ขั้นต่ำ",
    Missing: "ที่หายไป",
    Move: "เคลื่อนที่",
    Movement: "การเคลื่อนที่",
    Multishot: "ยิงหลายนัด",
    Npc: "ยูนิตทั่วไป",
    On: "เมื่อ",
    Outgoing: "ที่สร้าง",
    Per: "ต่อ",
    Percent: "เปอร์เซ็นต์",
    Percentage: "เปอร์เซ็นต์",
    Permanent: "ถาวร",
    Penalty: "โทษ",
    Power: "พลัง",
    Regen: "ฟื้นฟู",
    Projectile: "กระสุนสกิล",
    Radius: "รัศมี",
    Range: "ระยะ",
    Reduced: "ลด",
    Reduction: "ลด",
    Resist: "ต้านทาน",
    Resistance: "ต้านทาน",
    Restore: "ฟื้นคืน",
    Rocket: "จรวด",
    Scale: "สเกล",
    Shield: "โล่",
    Shots: "นัด",
    Silence: "ใบ้สกิล",
    Speed: "ความเร็ว",
    Slow: "ลดความเร็ว",
    Sprint: "วิ่ง",
    Steal: "ดูด",
    Spirit: "พลังวิญญาณ",
    Stack: "สแต็ก",
    Stacks: "สแต็ก",
    Stamina: "พลังงาน",
    Stop: "หยุดเวลา",
    Status: "สถานะ",
    Stun: "สตัน",
    Target: "เป้าหมาย",
    Targets: "เป้าหมาย",
    Tech: "เทค",
    Time: "เวลา",
    Taken: "ที่ได้รับ",
    Throw: "ขว้าง",
    Turrets: "ป้อมปืน",
    Turret: "ป้อมปืน",
    Unknown: "ไม่ทราบ",
    Vision: "การมองเห็น",
    Vs: "ต่อสู้กับ",
    Wall: "กำแพง",
    Weapon: "อาวุธ",
}

function plainText(value, isThai = true) {
    if (!value) return ""
    const withLineBreaks = String(value)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\{g:citadel_inline_attribute:'([^']+)'\}/g, (_, status) => (
            isThai ? statusTranslations[status] ?? status : status.replace(/([a-z])([A-Z])/g, "$1 $2")
        ))
        .replace(/\{g:citadel_binding:'([^']+)'\}/g, (_, binding) => (
            isThai ? bindingTranslations[binding] ?? "ปุ่มที่กำหนด" : bindingEnglishNames[binding] ?? "Bound key"
        ))
        .replace(/\{[^}]+\}/g, "")
    const parsed = new DOMParser().parseFromString(withLineBreaks, "text/html")
    return (parsed.body.textContent ?? "").replace(/[ \t]+\n/g, "\n").trim()
}

function thaiPropertyLabel(key) {
    if (statTranslations[key]) return statTranslations[key]
    const words = key.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|[0-9]+/g) ?? []
    const translated = words.map((word) => propertyWordTranslations[word] ?? propertyWordTranslations[word[0]?.toUpperCase() + word.slice(1).toLowerCase()])
    return translated.every(Boolean) ? translated.join(" ") : "ค่าการอัปเกรด"
}

function formatValue(value, scale, type, isThai = true) {
    if (value === null || value === undefined || value === -1) return null
    const numericValue = typeof value === "object" && value !== null ? value.Value : value
    if (numericValue === null || numericValue === undefined || numericValue === -1) return null
    let output = String(numericValue)
    const scaleValue = scale ?? (typeof value === "object" && value !== null ? value.Scale : null)
    if (scaleValue?.Value) {
        const scaleTerm = scaleValue.Type === "spirit" ? (isThai ? " พลังวิญญาณ" : " Spirit Power") : ""
        output += ` + ${scaleValue.Value}${scaleTerm}`
    }
    if (type === "cooldown" || type === "duration") output += isThai ? " วินาที" : " sec"
    return output
}

function getAbilityIcon(heroName, abilities, ability) {
    const index = abilities.indexOf(ability)
    if (index < 0) return ""
    return `${import.meta.env.VITE_ASSETS_SOURCE}abilities/${heroName}/${index + 1}.png`
}

export function AbilityDetailsDialog({
    ability,
    abilities,
    heroName,
    heroColor,
    language,
    onSelectAbility,
    onClose,
}) {
    const [isClosing, setIsClosing] = useState(false)
    const [abilityDataset, setAbilityDataset] = useState(null)
    const [datasetError, setDatasetError] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const dialogRef = useRef(null)
    const closeTimerRef = useRef(null)
    const isClosingRef = useRef(false)
    const onCloseRef = useRef(onClose)
    const activeAbility = abilityDataset?.abilities[`${heroName}|${ability}`]
    const icon = activeAbility?.icon
        ? `${import.meta.env.VITE_ASSETS_SOURCE}${activeAbility.icon}`
        : getAbilityIcon(heroName, abilities, ability)
    const isThai = language === "TH"
    const description = (isThai
        ? activeAbility?.descriptionThai ?? []
        : activeAbility?.descriptionEnglish ?? [])
        .map((text) => plainText(text, isThai))
        .filter(Boolean)
    const close = useCallback(() => {
        if (isClosingRef.current) return
        isClosingRef.current = true
        setIsClosing(true)
        closeTimerRef.current = window.setTimeout(() => onCloseRef.current(), 160)
    }, [])

    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        let isCurrent = true
        import("../assets/abilityDetails.json")
            .then(({ default: data }) => {
                if (isCurrent) setAbilityDataset(data)
            })
            .catch((error) => {
                console.error("Unable to load local ability details.", error)
                if (isCurrent) setDatasetError(true)
            })
        return () => {
            isCurrent = false
        }
    }, [retryCount])

    useEffect(() => {
        dialogRef.current?.focus()
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation()
                close()
                return
            }
            if (event.key === "Tab" && dialogRef.current) {
                const focusable = [...dialogRef.current.querySelectorAll(
                    'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
                )]
                if (!focusable.length) return
                const first = focusable[0]
                const last = focusable[focusable.length - 1]
                if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
                    event.preventDefault()
                    last.focus()
                } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
                    event.preventDefault()
                    first.focus()
                }
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            window.clearTimeout(closeTimerRef.current)
        }
    }, [close])

    const selectAdjacentAbility = (direction) => {
        const currentIndex = abilities.indexOf(ability)
        const nextIndex = (currentIndex + direction + abilities.length) % abilities.length
        onSelectAbility(abilities[nextIndex])
    }

    const heading = (thai, english) => (isThai ? thai : english)
    const renderValueRows = (rows, usePropertyKeys = false) => rows.map((row, index) => {
        const value = usePropertyKeys
            ? formatValue(row.value, null, null, isThai)
            : formatValue(row.value, row.scale, row.type, isThai)
        if (!value) return null
        const label = usePropertyKeys
            ? (isThai ? thaiPropertyLabel(row.key) : row.key)
            : (isThai ? thaiPropertyLabel(row.label) : row.label)
        return (
            <li key={`${row.key ?? row.label}-${index}`}>
                <span>{label}</span>
                <strong>{value}</strong>
            </li>
        )
    })

    return (
        <div
            className={`ability-dialog-backdrop${isClosing ? " is-closing" : ""}`}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) close()
            }}
            onTouchStart={(event) => {
                if (event.target === event.currentTarget) close()
            }}
        >
            <section
                ref={dialogRef}
                className="ability-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ability-dialog-title"
                tabIndex={-1}
                style={{ "--ability-accent": heroColor }}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                    if (event.key === "ArrowRight") selectAdjacentAbility(1)
                    if (event.key === "ArrowLeft") selectAdjacentAbility(-1)
                }}
            >
                <button className="ability-dialog-close" type="button" onClick={close} aria-label={heading("ปิดหน้าต่าง", "Close dialog")}>
                    ×
                </button>
                <header className="ability-dialog-header">
                    {icon && <img className="ability-dialog-icon" src={icon} alt="" />}
                    <div>
                        <p className="ability-dialog-eyebrow">{getCharacterName(heroName, language)}</p>
                        <h2 id="ability-dialog-title">
                            {isThai ? activeAbility?.abilityNameThai ?? getAbilityName(ability, language) : ability}
                        </h2>
                        <p className="ability-dialog-original-name">
                            {heading("ชื่อสกิลภาษาอังกฤษ", "English ability name")}: {activeAbility?.sourceAbilityName ?? ability}
                        </p>
                    </div>
                </header>

                <nav className="ability-dialog-selector" aria-label={heading("เลือกสกิล", "Choose ability")}>
                    {abilities.map((entry, index) => (
                        <button
                            key={`${entry}-${index}`}
                            type="button"
                            className={entry === ability ? "active" : ""}
                            aria-label={`${heading("สกิล", "Ability")} ${index + 1}: ${entry}`}
                            aria-current={entry === ability ? "true" : undefined}
                            onClick={() => onSelectAbility(entry)}
                        >
                            <img src={getAbilityIcon(heroName, abilities, entry)} alt="" />
                        </button>
                    ))}
                </nav>

                <div className="ability-dialog-body">
                    {datasetError ? (
                        <p className="ability-dialog-message">
                            {heading("โหลดข้อมูลสกิลไม่สำเร็จ", "Could not load ability data")}
                            {" "}
                            <button type="button" onClick={() => {
                                setDatasetError(false)
                                setRetryCount((count) => count + 1)
                            }}>
                                {heading("ลองอีกครั้ง", "Try again")}
                            </button>
                        </p>
                    ) : !abilityDataset ? (
                        <p className="ability-dialog-message">{heading("กำลังโหลดข้อมูลสกิล…", "Loading ability data…")}</p>
                    ) : !activeAbility ? (
                        <p className="ability-dialog-message">
                            {heading("ไม่พบข้อมูลสกิลในชุดข้อมูลออฟไลน์", "Ability data is unavailable in the local dataset")}
                        </p>
                    ) : (
                        <>
                            <section className="ability-dialog-description">
                                <h3>{heading("รายละเอียดสกิล", "Ability details")}</h3>
                                {description.length ? description.map((text, index) => (
                                    <p key={index}>{text}</p>
                                )) : (
                                    <p>{heading("ยังไม่มีคำอธิบายภาษาไทยในชุดข้อมูล", "No English description is available in this dataset.")}</p>
                                )}
                            </section>

                            {activeAbility.stats.length > 0 && (
                                <section>
                                    <h3>{heading("ค่าสกิล", "Ability stats")}</h3>
                                    <ul className="ability-dialog-source-details">
                                        {renderValueRows(activeAbility.stats)}
                                    </ul>
                                </section>
                            )}

                            {activeAbility.properties.length > 0 && (
                                <section>
                                    <h3>{heading("เอฟเฟกต์และกลไก", "Effects and mechanics")}</h3>
                                    <ul className="ability-dialog-source-details">
                                        {renderValueRows(activeAbility.properties)}
                                    </ul>
                                </section>
                            )}

                            {activeAbility.upgrades.length > 0 && (
                                <section className="ability-dialog-upgrades">
                                    <h3>{heading("อัปเกรดสกิล", "Ability upgrades")}</h3>
                                    {activeAbility.upgrades.map((upgrade) => {
                                        const translatedDescription = plainText(
                                            isThai ? upgrade.descriptionThai : upgrade.descriptionEnglish,
                                            isThai,
                                        )
                                        return (
                                            <article className="ability-dialog-upgrade" key={upgrade.tier}>
                                                <h4>{heading(`ขั้น ${upgrade.tier}`, `Tier ${upgrade.tier}`)}</h4>
                                                {translatedDescription && <p>{translatedDescription}</p>}
                                                {!translatedDescription && (
                                                    <ul className="ability-dialog-source-details">
                                                        {renderValueRows(upgrade.properties, true)}
                                                    </ul>
                                                )}
                                            </article>
                                        )
                                    })}
                                </section>
                            )}
                        </>
                    )}
                </div>

                <footer className="ability-dialog-footer">
                    <span className="ability-dialog-updated">
                        {heading("ข้อมูลชุดออฟไลน์", "Offline dataset")}
                        {abilityDataset?.generatedAt
                            ? ` · ${new Date(abilityDataset.generatedAt).toLocaleDateString(isThai ? "th-TH" : "en-US")}`
                            : ""}
                    </span>
                    <a href={activeAbility?.wikiUrl ?? "https://deadlock.wiki/"} target="_blank" rel="noreferrer">
                        {heading("เปิดแหล่งข้อมูล Deadlock Wiki ↗", "Open Deadlock Wiki source ↗")}
                    </a>
                </footer>
            </section>
        </div>
    )
}
