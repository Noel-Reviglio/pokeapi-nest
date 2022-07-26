import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { PokeResponse } from './interfaces/poke-response.interfaces';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';

@Injectable()
export class SeedService {
  
  private limit : number = 650;

  constructor( 
              @InjectModel( Pokemon.name ) 
              private readonly _pokemonModel: Model<Pokemon>,
              private readonly _http: AxiosAdapter,
  ) {}

  async executeSeed() {
  
    this.deleteAll();

    const data = await this._http.get<PokeResponse>(`https://pokeapi.co/api/v2/pokemon?limit=${this.limit}`);
    // Opción 1
    // const insertPomisesArray = []; //crea un Array de promesas, para insertar de manera asíncrona.
    // Opción 2 (mejorada)
    const pokemonToInsert : {name: string, no:number}[] = [];

    data.results.forEach( ({ name, url }) =>{
      const segments = url.split('/');

      const no = +segments[ segments.length - 2 ];
      
      //  await this._pokemonModel.create({ name, no });
      /* Opc 1
      insertPomisesArray.push(
        this._pokemonModel.create({ name, no })
      );
      */      
     // Opción 2
     pokemonToInsert.push({ name, no });
    });

    try {
      // Opción 1
      //const newArray = await Promise.all( insertPomisesArray );
      // Opción 2
      await this._pokemonModel.insertMany(pokemonToInsert);

    } catch (error) {
      if ( error.code === 11000) {
        throw new BadRequestException(`Pokemon exists in database.`);
      }
      console.log(error);
      throw new InternalServerErrorException(`Can't create Pokemon - Check server logs.`);
    }

    return 'Seed executed';
  }

  async deleteAll() {
    await this._pokemonModel.deleteMany({}); //Borra todos los elementos de la colección.
  }

}
