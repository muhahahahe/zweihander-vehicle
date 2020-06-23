/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ZweihanderActor extends Actor {

  /** @override */
  getRollData() {
    const data = super.getRollData();

    /*
    const shorthand = game.settings.get("zweihander", "macroShorthand");

    // Re-map all attributes onto the base roll data
    if ( !!shorthand ) {
      for ( let [k, v] of Object.entries(data.attributes) ) {
        if ( !(k in data) ) data[k] = v.value;
      }
      delete data.attributes;
    }

    // Map all items data using their slugified names
    data.items = this.data.items.reduce((obj, i) => {
      let key = i.name.slugify({strict: true});
      let itemData = duplicate(i.data);
      if ( !!shorthand ) {
        for ( let [k, v] of Object.entries(itemData.attributes) ) {
          if ( !(k in itemData) ) itemData[k] = v.value;
        }
        delete itemData["attributes"];
      }
      obj[key] = itemData;
      return obj;
    }, {});*/
    return data;
  }

  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    if (actorData.type === 'character') {
      this._prepareCharacterItems(actorData);
      this._prepareCharacterData(actorData);
    }

    // this.setFlag("zweihander", "professionDataInitialized", false);
  }

  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Calculate primary attribute bonuses (first digit)
    for (let attribute of Object.values(data.stats.primaryAttributes)) {
      const attributeString = ('' + attribute.value);
      attribute.bonus = attributeString.length == 1 ? 0 : Number(attributeString[0]);
    }

    
    // Add Ancestral Modifiers to the primary pttribute bonuses
    const ancestry = actorData.ancestry[0];

    if (ancestry) {
      for (let positiveModifier of ancestry.data.ancestralModifiers.positive.value.split(", ")) {
        if (!positiveModifier)
          break;

        const modifier = positiveModifier.replace(/[\[\]]/g, "")[0].toLowerCase();

        switch (modifier) {
          case "c":
            data.stats.primaryAttributes.combat.bonus += 1;
            break;
          case "b":
            data.stats.primaryAttributes.brawn.bonus += 1;
            break;
          case "a":
            data.stats.primaryAttributes.agility.bonus += 1;
            break;
          case "i":
            data.stats.primaryAttributes.intelligence.bonus += 1;
            break;
          case "p":
            data.stats.primaryAttributes.perception.bonus += 1;
            break;
          case "w":
            data.stats.primaryAttributes.willpower.bonus += 1;
            break;
          case "f":
            data.stats.primaryAttributes.fellowship.bonus += 1;
            break;
          default:
            console.log("No attribute found for value ", positiveModifier + ".");
            break;
        }
      }

      for (let negativeModifier of ancestry.data.ancestralModifiers.negative.value.split(", ")) {
        if (!negativeModifier)
          break;

        const modifier = negativeModifier.replace(/[\[\]]/g, "")[0].toLowerCase();

        switch (modifier) {
          case "c":
            data.stats.primaryAttributes.combat.bonus -= 1;
            break;
          case "b":
            data.stats.primaryAttributes.brawn.bonus -= 1;
            break;
          case "a":
            data.stats.primaryAttributes.agility.bonus -= 1;
            break;
          case "i":
            data.stats.primaryAttributes.intelligence.bonus -= 1;
            break;
          case "p":
            data.stats.primaryAttributes.perception.bonus -= 1;
            break;
          case "w":
            data.stats.primaryAttributes.willpower.bonus -= 1;
            break;
          case "f":
            data.stats.primaryAttributes.fellowship.bonus -= 1;
            break;
          default:
            console.log("No attribute found for value ", negativeModifier + ".");
            break;
        }
      }
    }

    for (let profession of actorData.professions) {
      const advanceData = profession.data.bonusAdvances.arrayOfValues;

      for (let advance of advanceData) {
        const cleanAdvance = advance.name.replace(/[\[\]]/g, "")[0].toLowerCase();

        if (advance.purchased) {
          switch (cleanAdvance) {
            case "c":
              data.stats.primaryAttributes.combat.bonus += 1;
              break;
            case "b":
              data.stats.primaryAttributes.brawn.bonus += 1;
              break;
            case "a":
              data.stats.primaryAttributes.agility.bonus += 1;
              break;
            case "i":
              data.stats.primaryAttributes.intelligence.bonus += 1;
              break;
            case "p":
              data.stats.primaryAttributes.perception.bonus += 1;
              break;
            case "w":
              data.stats.primaryAttributes.willpower.bonus += 1;
              break;
            case "f":
              data.stats.primaryAttributes.fellowship.bonus += 1;
              break;
            default:
              console.log("No attribute found for value ", advance + ".");
              break;
          }
        }
      }
    }

    // Assign a value to Parry equal to the value of its underlying skill 
    const parrySkill = data.stats.secondaryAttributes.parry.associatedSkill;
    const parrySkillItem = actorData.skills.find(skill => skill.name === parrySkill);1

    if (parrySkillItem) {
      const parryAttribute = parrySkillItem.data.associatedPrimaryAttribute.value.toLowerCase();
      const parryValue = data.stats.primaryAttributes[parryAttribute].value + parrySkillItem.data.ranks.bonus;  // TODO IGNORE SKILL RANKS

      data.stats.secondaryAttributes.parry.value = parryValue;
    }

    // Assign a value to Parry equal to the value of its underlying skill 
    const dodgeSkill = data.stats.secondaryAttributes.dodge.associatedSkill;
    const dodgeSkillItem = actorData.skills.find(skill => skill.name === dodgeSkill);

    if (dodgeSkillItem) {
      const dodgeAttribute = dodgeSkillItem.data.associatedPrimaryAttribute.value.toLowerCase();
      const dodgeValue = data.stats.primaryAttributes[dodgeAttribute].value + dodgeSkillItem.data.ranks.bonus;  // TODO IGNORE SKILL RANKS
  
      data.stats.secondaryAttributes.dodge.value = dodgeValue;
    }

    // Assign encumbrance overage TODO: Items, Armor, etc...
    //...

    // Assign initial encumbrance values
    data.stats.secondaryAttributes.encumbrance.value = data.stats.primaryAttributes.brawn.bonus + 3;


    // Calculate overage values
    const overage = data.stats.secondaryAttributes.encumbrance.current - data.stats.secondaryAttributes.encumbrance.value;
    const correctOverage = data.stats.secondaryAttributes.encumbrance.overage = (overage > 0) ? overage : 0;
    data.stats.secondaryAttributes.initiative.overage = data.stats.secondaryAttributes.movement.overage = correctOverage;


    // Assign Initiative values
    const initiativeValue = data.stats.secondaryAttributes.initiative.value = data.stats.primaryAttributes.perception.bonus + 3;
    data.stats.secondaryAttributes.initiative.current = initiativeValue - correctOverage;


    // Assign Movement values
    const movementValue = data.stats.secondaryAttributes.movement.value = data.stats.primaryAttributes.agility.bonus + 3;
    data.stats.secondaryAttributes.movement.current = movementValue - correctOverage;


    // Assign Peril Threshold values
    var initialPeril = data.stats.primaryAttributes.willpower.bonus, perilModifier = 3;

    const perilArray = Object.keys(data.stats.secondaryAttributes.perilThreshold);

    for (let i = 0; i < perilArray.length; i++) {
      data.stats.secondaryAttributes.perilThreshold[perilArray[i]] = initialPeril += perilModifier;

      if (i % 2)
        perilModifier += 3;
    }


    // Assign Damage Threshold values
    var initialDamage = data.stats.primaryAttributes.brawn.bonus, damageModifier = 6;

    const damageArray = Object.keys(data.stats.secondaryAttributes.damageThreshold);

    data.stats.secondaryAttributes.damageThreshold[damageArray[0]] = initialDamage;

    for (let i = 1; i < damageArray.length; i++)
      data.stats.secondaryAttributes.damageThreshold[damageArray[i]] = initialDamage += damageModifier;
  }

  _prepareCharacterItems(actorData) {
    const weapons = [];
    const armor = [];
    const ancestry = [];
    const spells = [];
    const professions = [];
    const skills = [];
    const talents = [];
    const drawbacks = [];
    const traits = [];

    for (let item of actorData.items) {
      if (item.type === "weapon")
        weapons.push(item);
      else if (item.type === "ancestry")
        ancestry.push(item);
      else if (item.type === "armor")
        armor.push(item);
      else if (item.type === "spell")
        spells.push(item);
      else if (item.type === "profession")
        professions.push(item);
      else if (item.type === "skill")  // TODO: Don't allow duplicate Skills -- !skills.some(skill => skill.name === item.name)
        skills.push(item);
      else if (item.type === "talent")
        talents.push(item);
      else if (item.type === "drawback")
        drawbacks.push(item);
      else if (item.type === "trait")
        traits.push(item);
    }

    actorData.weapons = weapons;
    actorData.ancestry = ancestry;
    actorData.armor = armor;
    actorData.spells = spells;
    actorData.professions = professions;

    actorData.skills = skills.sort((skillA, skillB) => {
      const nameA = skillA.name;
      const nameB = skillB.name;

      if (nameA < nameB) {
        return -1;
      }

      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });

    actorData.talents = talents;
    actorData.drawbacks = drawbacks;
    actorData.traits = traits;

    let skillCounter = new Map();

    for (let profession of actorData.professions) {
      const skillsArray = profession.data.skillRanks.value.split(", ");

      for (let skill of skillsArray) {
        if (skillCounter.has(skill)) {
          skillCounter.set(skill, skillCounter.get(skill) + 1);
        } else {
          skillCounter.set(skill, 1);
        }
      }
    }

    for (let profession of actorData.professions) {
      const skillsArray = profession.data.skillRanks.value.split(", ");
      let _temp = [];

      for (let skill of skillsArray) {
        const skillItem = actorData.items.find(item => item.name === skill);
        const ranks = skillItem === undefined ? {} : skillItem.data.ranks;

        const obj = {
          "name": skill,
          "ranks": ranks,
          "timesAvailable": skillCounter.get(skill) // TODO CHANGE
        };

        _temp.push(obj);
      }

      profession.data.skillRanks.arrayOfValues = _temp;

      const advancesArray = profession.data.bonusAdvances.value.split(',');

      _temp = [];
      let idxCounter = 0;

      for (let advance of advancesArray) {
        let purchased = false;

        const oldAdvancesArray = profession.data.bonusAdvances.arrayOfValues;

        if ((oldAdvancesArray.length > 0) && (advance.trim() === oldAdvancesArray[idxCounter].name))
          purchased = oldAdvancesArray[idxCounter].purchased;

        const obj = {
          "name": advance.trim(),
          "purchased": purchased,
          "index": idxCounter++
        };

        _temp.push(obj);
      }

      profession.data.bonusAdvances.arrayOfValues = _temp;

      const talentsArray = profession.data.talents.value.split(',');

      _temp = [];

      for (let talent of talentsArray) {
        const talentItem = actorData.items.find(item => item.name === talent.trim());
        const purchased = talentItem === undefined ? false : talentItem.data.purchased;

        const obj = {
          "name": talent.trim(),
          "purchased": purchased
        };

        _temp.push(obj);
      }

      profession.data.talents.arrayOfValues = _temp;
    }




    // for (let armor of actorData.armor) {
    //   if (armor.data.equipped)
    //     this._prepareDamageThreshold(armor, actorData);
    // }
  }
}
